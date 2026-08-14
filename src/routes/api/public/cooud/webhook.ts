import { createFileRoute } from "@tanstack/react-router";

type CooudEvent = {
  id?: string;
  type?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

const PAID_EVENTS = new Set([
  "checkout_session.completed",
  "checkout-session.completed",
  "payment.succeeded",
  "payment_intent.succeeded",
  "order.paid",
  "charge.succeeded",
]);

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const Route = createFileRoute("/api/public/cooud/webhook")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, endpoint: "cooud-webhook" }),
      POST: async ({ request }) => {
        const raw = await request.text();

        const secret = process.env["COOUD_WEBHOOK_SECRET"];
        if (secret) {
          const header =
            request.headers.get("cooud-signature") ??
            request.headers.get("x-cooud-signature") ??
            request.headers.get("x-signature") ??
            "";
          // Aceita "sha256=<hex>", "v1=<hex>" ou apenas "<hex>".
          const received = header.split(",").pop()?.split("=").pop()?.trim() ?? "";
          const expected = await hmacHex(secret, raw);
          if (!received || !timingSafeEqual(received.toLowerCase(), expected)) {
            console.error("[Cooud webhook] assinatura inválida");
            return new Response("invalid signature", { status: 401 });
          }
        }

        let event: CooudEvent = {};
        try {
          event = JSON.parse(raw) as CooudEvent;
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const type = String(event.type ?? "");
        const paid = PAID_EVENTS.has(type) || /succeed|paid|completed/i.test(type);

        console.info("[Cooud webhook] evento recebido", {
          id: event.id,
          type,
          paid,
        });

        // Guarda o payload cru para descobrir o formato real dos eventos da Cooud.
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const data = (event.data ?? {}) as Record<string, unknown>;
          const sessionId =
            typeof data["checkout_session_id"] === "string"
              ? (data["checkout_session_id"] as string)
              : typeof data["id"] === "string"
                ? (data["id"] as string)
                : null;
          await supabaseAdmin.from("payment_events").insert({
            source: "webhook",
            event_type: type || "unknown",
            session_id: sessionId,
            amount: typeof data["amount"] === "number" ? (data["amount"] as number) : null,
            currency: typeof data["currency"] === "string" ? (data["currency"] as string) : null,
            message: paid ? "paid" : null,
            payload: event as unknown as Record<string, unknown>,
          });
        } catch (error) {
          console.error("[Cooud webhook] falha ao registrar evento", error);
        }

        return Response.json({ received: true, paid });
      },
    },
  },
});