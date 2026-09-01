import { createFileRoute } from "@tanstack/react-router";

type VendepayPayload = {
  event?: string;
  id?: string;
  vendaId?: string;
  produtoId?: string;
  checkoutId?: string;
  emailComprador?: string;
  nomeComprador?: string;
  valorPago?: number;
  valor?: number;
  moeda?: string | number;
  status?: number;
  [key: string]: unknown;
};

/** Venda aprovada = event "compra.aprovada" ou status 2 (Paga). */
function isApproved(payload: VendepayPayload, headerEvent: string | null): boolean {
  const event = String(payload.event ?? headerEvent ?? "").toLowerCase();
  return event === "compra.aprovada" || Number(payload.status) === 2;
}

/** A VendePay envia valores inteiros em centavos; decimais já vêm na moeda. */
function normalizeAmount(amount: number | null): number {
  if (!amount || Number.isNaN(amount)) return 0;
  return Number.isInteger(amount) && Math.abs(amount) >= 100 ? amount / 100 : amount;
}


export const Route = createFileRoute("/api/public/vendepay/webhook")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, endpoint: "vendepay-webhook" }),
      POST: async ({ request }) => {
        const raw = await request.text();

        // A VendePay envia o secret no header x-signature-key.
        const secret = process.env["VENDEPAY_WEBHOOK_SECRET"];
        if (secret) {
          const received = request.headers.get("x-signature-key") ?? "";
          if (received !== secret) {
            console.error("[Vendepay webhook] x-signature-key inválido");
            return new Response("invalid signature", { status: 401 });
          }
        }

        let payload: VendepayPayload = {};
        try {
          payload = JSON.parse(raw) as VendepayPayload;
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const headerEvent = request.headers.get("x-webhook-event");
        const isTest = request.headers.get("x-webhook-test") === "true";
        const approved = isApproved(payload, headerEvent);
        const eventName = String(payload.event ?? headerEvent ?? "unknown");
        const sessionId =
          payload.vendaId ?? payload.id ?? payload.checkoutId ?? null;
        const amount =
          typeof payload.valorPago === "number"
            ? payload.valorPago
            : typeof payload.valor === "number"
              ? payload.valor
              : null;

        console.info("[Vendepay webhook]", {
          event: eventName,
          status: payload.status,
          approved,
          isTest,
          sessionId,
        });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("payment_events").insert({
            source: "vendepay_webhook",
            event_type: eventName,
            session_id: sessionId,
            product_id: payload.produtoId ?? null,
            amount,
            currency: typeof payload.moeda === "string" ? payload.moeda : null,
            message: approved ? "paid" : isTest ? "test" : null,
            payload: JSON.parse(raw) as never,
          });

          if (approved && sessionId) {
            await supabaseAdmin.from("deliverable_purchases").upsert(
              {
                session_id: sessionId,
                product_id: payload.produtoId ?? null,
                email: payload.emailComprador ?? null,
                amount,
                currency: typeof payload.moeda === "string" ? payload.moeda : "EUR",
              },
              { onConflict: "session_id" },
            );

            // Purchase server-side no TikTok (event_id = sessionId para deduplicar
            // com o evento do navegador disparado na thank-you page).
            const { sendTikTokPurchase } = await import("@/lib/tiktok-capi.server");
            const metadata = (payload.metadata ?? {}) as Record<string, unknown>;
            const capi = await sendTikTokPurchase({
              eventId: sessionId,
              email: payload.emailComprador ?? null,
              phone: (payload.telefoneComprador as string | undefined) ?? null,
              value: normalizeAmount(amount),
              currency: typeof payload.moeda === "string" ? payload.moeda : "EUR",
              productId: payload.produtoId ?? null,
              ttclid:
                (payload.ttclid as string | undefined) ?? (metadata.ttclid as string | undefined) ?? null,
              ttp: (payload.ttp as string | undefined) ?? (metadata.ttp as string | undefined) ?? null,
              url: "https://tiktok-francevendpay.lovable.app/up1",
            });

            await supabaseAdmin.from("payment_events").insert({
              source: "tiktok_capi",
              event_type: "Purchase",
              session_id: sessionId,
              product_id: payload.produtoId ?? null,
              amount,
              currency: typeof payload.moeda === "string" ? payload.moeda : "EUR",
              message: capi.ok ? "sent" : `failed:${"reason" in capi ? capi.reason : "unknown"}`,
              payload: capi as never,
            });

            // Entrega automática do infoproduto por e-mail (somente pagamento aprovado).
            const { deliverPurchaseEmail } = await import("@/lib/email-delivery.server");
            const delivery = await deliverPurchaseEmail({
              saleId: sessionId,
              email: payload.emailComprador ?? null,
              name: payload.nomeComprador ?? null,
              productId: payload.produtoId ?? null,
            });
            console.info("[Vendepay webhook] entrega por e-mail", {
              sessionId,
              status: delivery.status,
            });
          }

        } catch (error) {
          console.error("[Vendepay webhook] falha ao registrar evento", error);
        }

        return Response.json({ received: true, approved, redirect_url: "/up1" });
      },
    },
  },
});
