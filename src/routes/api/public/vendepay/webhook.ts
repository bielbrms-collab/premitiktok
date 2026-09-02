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

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

/** Venda aprovada = event "compra.aprovada" ou status 2 (Paga). */
function isApproved(payload: VendepayPayload, headerEvent: string | null): boolean {
  const data = objectValue(payload.data);
  const event = String(payload.event ?? payload.type ?? data.event ?? data.type ?? headerEvent ?? "").toLowerCase();
  const status = String(payload.status ?? data.status ?? "").toLowerCase();
  return event === "compra.aprovada" || /approved|aprovad|paid|paga|succeed/.test(event) || status === "2" || /approved|aprovad|paid|paga|succeed/.test(status);
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
        const data = objectValue(payload.data);
        const customer = objectValue(payload.customer ?? data.customer ?? data.comprador);
        const metadata = objectValue(payload.metadata ?? data.metadata);
        const isTest = request.headers.get("x-webhook-test") === "true";
        const approved = isApproved(payload, headerEvent);
        const eventName = String(payload.event ?? payload.type ?? data.event ?? data.type ?? headerEvent ?? "unknown");
        const sessionId = firstString(payload.vendaId, payload.id, payload.checkoutId, data.vendaId, data.id, data.checkoutId, data.session_id);
        const productId = firstString(payload.produtoId, data.produtoId, data.product_id, metadata.productId, metadata.product_id);
        const email = firstString(payload.emailComprador, data.emailComprador, data.email, customer.email);
        const name = firstString(payload.nomeComprador, data.nomeComprador, data.name, customer.name);
        const phone = firstString(payload.telefoneComprador, data.telefoneComprador, data.phone, customer.phone);
        const currency = firstString(payload.moeda, data.moeda, data.currency) ?? "EUR";
        const amount = firstNumber(payload.valorPago, payload.valor, data.valorPago, data.valor, data.amount);
        const ttclid = firstString(payload.ttclid, data.ttclid, metadata.ttclid);
        const ttp = firstString(payload.ttp, data.ttp, metadata.ttp, metadata._ttp);

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
            product_id: productId,
            amount,
            currency,
            message: approved ? `paid;ttclid=${ttclid ? "yes" : "no"};ttp=${ttp ? "yes" : "no"}` : isTest ? "test" : null,
            payload: JSON.parse(raw) as never,
          });

          if (approved && sessionId) {
            await supabaseAdmin.from("deliverable_purchases").upsert(
              {
                session_id: sessionId,
                product_id: productId,
                email,
                amount,
                currency,
              },
              { onConflict: "session_id" },
            );

            // Purchase server-side no TikTok (event_id = sessionId para deduplicar
            // com o evento do navegador disparado na thank-you page).
            const { sendTikTokPurchase } = await import("@/lib/tiktok-capi.server");
            const capi = await sendTikTokPurchase({
              eventId: sessionId,
              email,
              phone,
              value: normalizeAmount(amount),
              currency,
              productId,
              ttclid,
              ttp,
              url: firstString(metadata.success_url, metadata.url) ?? "https://tiktok-francevendpay.lovable.app/up1",
            });

            await supabaseAdmin.from("payment_events").insert({
              source: "tiktok_capi",
              event_type: "Purchase",
              session_id: sessionId,
              product_id: productId,
              amount,
              currency,
              message: capi.ok
                ? `sent;ttclid=${ttclid ? "yes" : "no"};ttp=${ttp ? "yes" : "no"}`
                : `failed:${"reason" in capi ? capi.reason : "unknown"};ttclid=${ttclid ? "yes" : "no"};ttp=${ttp ? "yes" : "no"}`,
              payload: capi as never,
            });

            // Entrega automática do infoproduto por e-mail (somente pagamento aprovado).
            const { deliverPurchaseEmail } = await import("@/lib/email-delivery.server");
            const delivery = await deliverPurchaseEmail({
              saleId: sessionId,
              email,
              name,
              productId,
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
