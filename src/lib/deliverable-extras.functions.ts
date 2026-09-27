import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Somma degli ordini pagati (webhook Cooud) associati all'e-mail del lead.
export const getLeadTotal = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ email: z.string().email().max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const res = await supabaseAdmin
      .from("payment_events")
      .select("payload")
      .eq("event_type", "order.paid")
      .ilike("payload->data->user->>email", email)
      .limit(200);
    const seen = new Set<string>();
    let total = 0;
    let currency = "EUR";
    for (const row of res.data ?? []) {
      const d = (row.payload as { data?: Record<string, unknown> } | null)?.data;
      if (!d) continue;
      const id = String(d.id ?? "");
      if (id && seen.has(id)) continue;
      seen.add(id);
      total += Number(d.total_amount ?? 0) || 0;
      if (typeof d.currency === "string") currency = d.currency.toUpperCase();
    }
    return { totalCents: total, currency, orders: seen.size };
  });

const refundSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  reason: z.string().trim().min(2).max(200),
  details: z.string().trim().max(3000).optional(),
  sessionId: z.string().max(200).optional(),
});

export const submitRefundRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => refundSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("refund_requests" as never).insert({
      name: data.name,
      email: data.email.toLowerCase(),
      reason: data.reason,
      details: data.details ?? null,
      session_id: data.sessionId ?? null,
    } as never);
    if (error) throw new Error("Impossibile registrare la richiesta.");
    return { ok: true };
  });
