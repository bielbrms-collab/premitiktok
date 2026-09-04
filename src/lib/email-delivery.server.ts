import { sendLovableEmail, EmailAPIError } from "@lovable.dev/email-js";
import {
  renderEmailHtml,
  renderEmailSubject,
  renderEmailText,
  type EmailTemplate,
  type EmailVars,
} from "@/lib/email-template";

export type SendResult = { sent: boolean; status: string; error?: string; messageId?: string };

/** Único domínio autenticado (SPF/DKIM/DMARC) do projeto. */
export const SENDER_DOMAIN = "notify.suporttk.shop";
export const DEFAULT_FROM_EMAIL = `support@${SENDER_DOMAIN}`;
export const DEFAULT_FROM_NAME = "Assistenza clienti";
/** Base pública usada no pixel de rastreamento de aberturas. */
export const PUBLIC_BASE_URL = "https://premitiktok.lovable.app";

/**
 * Garante que o envelope use sempre o domínio autenticado.
 * Enviar de um domínio de terceiros (gmail.com, etc.) quebra DKIM/DMARC
 * e derruba a entregabilidade — por isso o remetente é normalizado aqui.
 */
function resolveSender(tpl: EmailTemplate) {
  const email = tpl.from_email?.trim().toLowerCase() ?? "";
  const fromEmail = email.endsWith(`@${SENDER_DOMAIN}`) ? email : DEFAULT_FROM_EMAIL;
  const fromName = (tpl.from_name ?? "").trim() || DEFAULT_FROM_NAME;
  const reply = tpl.reply_to?.trim().toLowerCase();
  const replyTo = reply && reply.endsWith(`@${SENDER_DOMAIN}`) ? reply : fromEmail;
  return { fromEmail, fromName, replyTo };
}

export async function sendTemplateEmail(
  tpl: EmailTemplate,
  to: string,
  vars: EmailVars,
  opts: { idempotencyKey?: string; label?: string; trackingUrl?: string } = {},
): Promise<SendResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { sent: false, status: "failed", error: "LOVABLE_API_KEY mancante" };

  const { fromEmail, fromName, replyTo } = resolveSender(tpl);

  try {
    const response = await sendLovableEmail(
      {
        to,
        from: `${fromName} <${fromEmail}>`,
        reply_to: replyTo,
        sender_domain: SENDER_DOMAIN,
        subject: renderEmailSubject(tpl, vars),
        html: renderEmailHtml(tpl, vars, { trackingUrl: opts.trackingUrl }),
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
      return { sent: false, status: "suppressed", error: "Destinatario non raggiungibile (bounce/disiscrizione)" };
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
    await record({ status: "failed", error_message: "Nessun modello attivo" });
    return { sent: false, status: "failed", error: "Nessun modello attivo" };
  }
  if (!input.email) {
    await record({ status: "failed", template_id: tpl.id, error_message: "Email del cliente mancante" });
    return { sent: false, status: "failed", error: "Email del cliente mancante" };
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
