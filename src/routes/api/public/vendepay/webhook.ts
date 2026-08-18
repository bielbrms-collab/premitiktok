import { createFileRoute } from "@tanstack/react-router";

type VendepayEvent = {
  id?: string;
  event?: string;
  status?: string;
  type?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

const PAID = /paid|approved|succeed|completed|aprovad|pago/i;

export const Route = createFileRoute("/api/public/vendepay/webhook")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, endpoint: "vendepay-webhook" }),
      POST: async ({ request }) => {
        const raw = await request.text();

        // Verificação opcional de segredo (defina VENDEPAY_WEBHOOK_SECRET se a Vendepay enviar token).
        const secret = process.env["VENDEPAY_WEBHOOK_SECRET"];
        if (secret) {
          const received =
            request.headers.get("x-vendepay-token") ??
            request.headers.get("x-webhook-token") ??
            request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
            new URL(request.url).searchParams.get("token") ??
            "";
          if (received !== secret) {
            console.error("[Vendepay webhook] token inválido");
            return new Response("invalid token", { status: 401 });
          }
        }

        let event: VendepayEvent = {};
        try {
          event = JSON.parse(raw) as VendepayEvent;
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const data = (event.data ?? {}) as Record<string, unknown>;
        const type = String(event.event ?? event.type ?? data["status"] ?? event.status ?? "");
        const paid = PAID.test(type) || PAID.test(String(data["status"] ?? ""));

        console.info("[Vendepay webhook] evento recebido", { id: event.id, type, paid });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const sessionId =
            typeof data["transaction_id"] === "string"
              ? (data["transaction_id"] as string)
              : typeof data["id"] === "string"
                ? (data["id"] as string)
                : typeof event.id === "string"
                  ? event.id
                  : null;
          await supabaseAdmin.from("payment_events").insert({
            source: "vendepay_webhook",
            event_type: type || "unknown",
            session_id: sessionId,
            amount: typeof data["amount"] === "number" ? (data["amount"] as number) : null,
            currency: typeof data["currency"] === "string" ? (data["currency"] as string) : null,
            message: paid ? "paid" : null,
            payload: JSON.parse(raw) as never,
          });
        } catch (error) {
          console.error("[Vendepay webhook] falha ao registrar evento", error);
        }

        return Response.json({ received: true, paid, redirect_url: "/up1" });
      },
    },
  },
});
