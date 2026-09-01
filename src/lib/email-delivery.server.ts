import { sendLovableEmail, EmailAPIError } from "@lovable.dev/email-js";
import {
  renderEmailHtml,
  renderEmailSubject,
  renderEmailText,
  type EmailTemplate,
  type EmailVars,
} from "@/lib/email-template";

export type SendResult = { sent: boolean; status: string; error?: string; messageId?: string };

function senderDomain(from: string): string {
  return from.split("@")[1] ?? "";
}

export async function sendTemplateEmail(
  tpl: EmailTemplate,
  to: string,
  vars: EmailVars,
  opts: { idempotencyKey?: string; label?: string } = {},
): Promise<SendResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { sent: false, status: "failed", error: "LOVABLE_API_KEY manquante" };

  try {
    const response = await sendLovableEmail(
      {
        to,
        from: `${tpl.from_name} <${tpl.from_email}>`,
        sender_domain: senderDomain(tpl.from_email),
        subject: renderEmailSubject(tpl, vars),
        html: renderEmailHtml(tpl, vars),
        text: renderEmailText(tpl, vars),
        purpose: "transactional",
        label: opts.label ?? "delivery",
        ...(opts.idempotencyKey ? { idempotency_key: opts.idempotencyKey } : {}),
      },
      { apiKey, ...(opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}) },
    );
    const result: SendResult = { sent: true, status: "sent" };
    if (response.message_id) result.messageId = response.message_id;
    return result;
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === "recipient_suppressed") {
      return { sent: false, status: "suppressed", error: "Destinataire supprimé (bounce/désinscription)" };
    }
    return {
      sent: false,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

type DeliverInput = {
  saleId: string;
  email: string | null | undefined;
  name?: string | null;
  productId?: string | null;
  productName?: string | null;
  /** Permite reenvio manual pelo painel, ignorando a proteção de duplicidade. */
  force?: boolean;
};

/** Seleciona o modelo do produto (ou o padrão), envia e registra o resultado. */
export async function deliverPurchaseEmail(input: DeliverInput): Promise<SendResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const existing = await supabaseAdmin
    .from("email_deliveries")
    .select("id, status, attempts")
    .eq("sale_id", input.saleId)
    .maybeSingle();

  if (existing.data?.status === "sent" && !input.force) {
    return { sent: false, status: "duplicate" };
  }

  const templates = await supabaseAdmin
    .from("email_templates")
    .select("*")
    .eq("active", true);

  const list = (templates.data ?? []) as unknown as EmailTemplate[];
  const tpl =
    (input.productId ? list.find((t) => t.product_id === input.productId) : undefined) ??
    list.find((t) => t.is_default) ??
    list[0];

  const baseRow = {
    sale_id: input.saleId,
    product_id: input.productId ?? null,
    recipient_email: input.email ?? null,
    recipient_name: input.name ?? null,
    attempts: (existing.data?.attempts ?? 0) + 1,
  };

  const record = async (row: Record<string, unknown>) => {
    const { error } = await supabaseAdmin
      .from("email_deliveries")
      .upsert({ ...baseRow, ...row } as never, { onConflict: "sale_id" });
    if (error) console.error("[email delivery] falha ao registrar histórico", error.message);
  };

  if (!tpl) {
    await record({ status: "failed", error_message: "Aucun modèle actif" });
    return { sent: false, status: "failed", error: "Aucun modèle actif" };
  }
  if (!input.email) {
    await record({ status: "failed", template_id: tpl.id, error_message: "E-mail acheteur manquant" });
    return { sent: false, status: "failed", error: "E-mail acheteur manquant" };
  }

  const vars: EmailVars = {
    name: input.name ?? null,
    email: input.email,
    product: input.productName ?? tpl.name,
    saleId: input.saleId,
  };

  let result = await sendTemplateEmail(tpl, input.email, vars, {
    idempotencyKey: `delivery:${input.saleId}${input.force ? `:${Date.now()}` : ""}`,
    label: "purchase-delivery",
  });

  // Uma única tentativa controlada de reenvio em caso de falha transitória.
  if (!result.sent && result.status === "failed") {
    result = await sendTemplateEmail(tpl, input.email, vars, {
      idempotencyKey: `delivery:${input.saleId}:retry${input.force ? `:${Date.now()}` : ""}`,
      label: "purchase-delivery-retry",
    });
  }

  await record({
    template_id: tpl.id,
    subject: renderEmailSubject(tpl, vars),
    status: result.status,
    error_message: result.error ?? null,
    sent_at: result.sent ? new Date().toISOString() : null,
    attempts: baseRow.attempts + (result.sent ? 0 : 1),
  });

  return result;
}
