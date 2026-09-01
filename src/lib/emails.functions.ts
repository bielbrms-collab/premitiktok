import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { EmailDelivery, EmailTemplate } from "@/lib/email-template";

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  product_id: z.string().max(120).nullable().optional(),
  subject: z.string().min(1).max(300),
  from_name: z.string().min(1).max(120),
  from_email: z.string().email().max(200),
  reply_to: z.string().email().max(200).nullable().optional(),
  heading: z.string().max(300),
  intro: z.string().max(1000),
  body_text: z.string().max(5000),
  button_label: z.string().min(1).max(120),
  deliverable_url: z.string().url().max(500),
  fallback_note: z.string().max(500),
  signature: z.string().max(500),
  accent_color: z.string().max(20),
  active: z.boolean(),
  is_default: z.boolean(),
});

export const listEmailTemplates = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailTemplate[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as EmailTemplate[];
  },
);

export const saveEmailTemplate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => templateSchema.parse(input))
  .handler(async ({ data }): Promise<EmailTemplate> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...fields } = data;
    const payload = { ...fields, product_id: fields.product_id || null };

    const query = id
      ? supabaseAdmin.from("email_templates").update(payload as never).eq("id", id)
      : supabaseAdmin.from("email_templates").insert(payload as never);

    const { data: saved, error } = await query.select("*").single();
    if (error) throw new Error(error.message);

    if (payload.is_default) {
      await supabaseAdmin
        .from("email_templates")
        .update({ is_default: false } as never)
        .neq("id", (saved as { id: string }).id);
    }
    return saved as unknown as EmailTemplate;
  });

export const deleteEmailTemplate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("email_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ to: z.string().email().max(200), template: templateSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { sendTemplateEmail } = await import("@/lib/email-delivery.server");
    const tpl = {
      ...data.template,
      id: data.template.id ?? "preview",
      product_id: data.template.product_id ?? null,
    } as EmailTemplate;

    const result = await sendTemplateEmail(
      tpl,
      data.to,
      { name: "Test", email: data.to, product: tpl.name, saleId: "TEST-0001" },
      { idempotencyKey: `test:${data.to}:${Date.now()}`, label: "delivery-test" },
    );
    return result;
  });

export const listEmailDeliveries = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailDelivery[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("email_deliveries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as EmailDelivery[];
  },
);

export const resendDeliveryEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ saleId: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deliverPurchaseEmail } = await import("@/lib/email-delivery.server");

    const { data: row } = await supabaseAdmin
      .from("email_deliveries")
      .select("sale_id, recipient_email, recipient_name, product_id")
      .eq("sale_id", data.saleId)
      .maybeSingle();
    if (!row) throw new Error("Envio não encontrado.");

    return deliverPurchaseEmail({
      saleId: row.sale_id,
      email: row.recipient_email,
      name: row.recipient_name,
      productId: row.product_id,
      force: true,
    });
  });
