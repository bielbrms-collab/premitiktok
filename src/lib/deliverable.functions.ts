import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TOTAL_DAYS, type DeliverableState } from "@/lib/deliverable-content";

const inputSchema = z.object({
  sessionId: z.string().min(6).max(200),
  email: z.string().email().optional(),
  productId: z.string().max(100).optional(),
});

function madridDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function daysBetweenMadrid(from: Date, to: Date) {
  const [fy, fm, fd] = madridDayKey(from).split("-").map(Number);
  const [ty, tm, td] = madridDayKey(to).split("-").map(Number);
  const diff = Date.UTC(ty!, tm! - 1, td!) - Date.UTC(fy!, fm! - 1, fd!);
  return Math.floor(diff / 86400000);
}

function buildState(row: {
  session_id: string;
  email: string | null;
  purchased_at: string;
  amount: number | null;
  currency: string | null;
}): DeliverableState {
  const purchasedAt = new Date(row.purchased_at);
  let index = daysBetweenMadrid(purchasedAt, new Date());
  if (index < 0) index = 0;
  if (index > TOTAL_DAYS - 1) index = TOTAL_DAYS - 1;
  const day = index + 1;
  return {
    sessionId: row.session_id,
    email: row.email,
    purchasedAt: purchasedAt.toISOString(),
    day,
    totalDays: TOTAL_DAYS,
    progress: Math.round((day / TOTAL_DAYS) * 100),
    released: day >= TOTAL_DAYS,
    amount: row.amount,
    currency: row.currency ?? "EUR",
  };
}

export const ensureDeliverable = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<DeliverableState> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const existing = await supabaseAdmin
      .from("deliverable_purchases")
      .select("session_id, email, purchased_at, amount, currency")
      .eq("session_id", data.sessionId)
      .maybeSingle();

    if (existing.data) return buildState(existing.data);

    const inserted = await supabaseAdmin
      .from("deliverable_purchases")
      .insert({
        session_id: data.sessionId,
        email: data.email ?? null,
        product_id: data.productId ?? null,
      })
      .select("session_id, email, purchased_at, amount, currency")
      .single();

    if (inserted.error || !inserted.data) {
      const retry = await supabaseAdmin
        .from("deliverable_purchases")
        .select("session_id, email, purchased_at, amount, currency")
        .eq("session_id", data.sessionId)
        .single();
      if (retry.error || !retry.data) throw new Error("Impossible d’enregistrer votre commande.");
      return buildState(retry.data);
    }

    return buildState(inserted.data);
  });

const emailSchema = z.object({ email: z.string().email().max(200) });

export const lookupDeliverableByEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => emailSchema.parse(input))
  .handler(async ({ data }): Promise<DeliverableState> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    const existing = await supabaseAdmin
      .from("deliverable_purchases")
      .select("session_id, email, purchased_at, amount, currency")
      .eq("email", email)
      .order("purchased_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing.data) return buildState(existing.data);

    const sessionId = `email:${email}`;
    const inserted = await supabaseAdmin
      .from("deliverable_purchases")
      .insert({ session_id: sessionId, email })
      .select("session_id, email, purchased_at, amount, currency")
      .single();

    if (inserted.error || !inserted.data) {
      const retry = await supabaseAdmin
        .from("deliverable_purchases")
        .select("session_id, email, purchased_at, amount, currency")
        .eq("session_id", sessionId)
        .single();
      if (retry.error || !retry.data) throw new Error("Impossibile consultare il tuo prelievo.");
      return buildState(retry.data);
    }

    return buildState(inserted.data);
  });
