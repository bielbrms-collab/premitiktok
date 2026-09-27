import { createFileRoute } from "@tanstack/react-router";
import { PRODUCTS } from "@/lib/cooud-products";

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
          const timestamp =
            request.headers.get("cooud-timestamp") ??
            request.headers.get("x-cooud-timestamp") ??
            "";
          // A Cooud pode enviar "sha256=<hex>", "t=...,v1=<hex>", base64 ou hex puro.
          const candidates = header
            .split(",")
            .map((part) => part.split("=").pop()?.trim().toLowerCase() ?? "")
            .filter(Boolean);
          const payloads = timestamp ? [raw, `${timestamp}.${raw}`] : [raw];
          const expected: string[] = [];
          for (const payload of payloads) expected.push(await hmacHex(secret, payload));

          const valid = candidates.some((c) => expected.some((e) => timingSafeEqual(c, e)));
          if (!valid) {
            // Nunca descartar uma venda por diferença de formato de assinatura:
            // registramos o evento como não verificado e seguimos processando.
            console.warn("[Cooud webhook] assinatura não verificada", {
              headerPresent: Boolean(header),
              headerLength: header.length,
              candidates: candidates.length,
            });
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
            payload: JSON.parse(raw) as never,
          });
        } catch (error) {
          console.error("[Cooud webhook] falha ao registrar evento", error);
        }

        // Compra aprovada: dispara o e-mail de entrega para o comprador.
        // Somente vendas do Front recebem e-mail — upsells e back-redirect
        // seguem apenas com registro da venda e Purchase no TikTok.
        const paidData = (event.data ?? {}) as Record<string, unknown>;
        const paidAmount =
          typeof paidData["total_amount"] === "number"
            ? (paidData["total_amount"] as number)
            : typeof paidData["amount"] === "number"
              ? (paidData["amount"] as number)
              : null;
        const paidCurrency =
          typeof paidData["currency"] === "string"
            ? (paidData["currency"] as string).toUpperCase()
            : "EUR";
        const paidMatch = Object.entries(PRODUCTS).find(
          ([, p]) => p.amount === paidAmount && p.currency === paidCurrency,
        );
        const isFrontSale = paidMatch?.[1]?.stage === "front";

        if (paid && isFrontSale) {
          try {
            const data = (event.data ?? {}) as Record<string, unknown>;
            const pick = (...keys: string[]) => {
              for (const key of keys) {
                const value = data[key];
                if (typeof value === "string" && value.trim()) return value.trim();
              }
              return null;
            };
            const nested = (obj: unknown, key: string) =>
              obj && typeof obj === "object"
                ? ((obj as Record<string, unknown>)[key] as string | undefined)
                : undefined;
            const customer =
              data["user"] ?? data["customer"] ?? data["buyer"] ?? data["billing_details"];
            const email =
              pick("customer_email", "buyer_email", "email", "receipt_email") ??
              (typeof nested(customer, "email") === "string" ? nested(customer, "email")!.trim() : null);
            const name =
              pick("customer_name", "buyer_name", "name") ??
              (typeof nested(customer, "name") === "string" ? nested(customer, "name")!.trim() : null);

            const rawAmount =
              typeof data["amount"] === "number"
                ? (data["amount"] as number)
                : typeof data["total_amount"] === "number"
                  ? (data["total_amount"] as number)
                  : null;
            const amount = rawAmount;
            const currency =
              typeof data["currency"] === "string"
                ? (data["currency"] as string).toUpperCase()
                : "EUR";
            const match = Object.entries(PRODUCTS).find(
              ([, p]) => p.amount === amount && p.currency === currency,
            );

            // Prefere o id da sessão de checkout (estável entre reenvios do
            // webhook) para que a mesma compra nunca gere e-mail duplicado,
            // mesmo se a Cooud reenviar o evento com um id novo.
            const saleId =
              pick("checkout_session_id", "session_id", "payment_id", "charge_id") ??
              pick("id") ??
              event.id ??
              `cooud:${Date.now()}`;

            const { deliverPurchaseEmail } = await import("@/lib/email-delivery.server");
            const result = await deliverPurchaseEmail({
              saleId: `cooud:${saleId}`,
              email,
              name,
              productId: match?.[0] ?? null,
              productName: match?.[1]?.name ?? null,
            });
            console.info("[Cooud webhook] e-mail de entrega", { saleId, email, ...result });
          } catch (error) {
            console.error("[Cooud webhook] falha ao enviar e-mail de entrega", error);
          }

          // Fonte única do Purchase no TikTok: o servidor. O ID do pedido é
          // estável entre reenvios do webhook, então a mesma compra nunca é
          // contada duas vezes (event_id deduplica na própria TikTok).
          try {
            const data = (event.data ?? {}) as Record<string, unknown>;
            const orderId =
              typeof data["id"] === "string" ? (data["id"] as string) : (event.id ?? null);
            const totalAmount =
              typeof data["total_amount"] === "number"
                ? (data["total_amount"] as number)
                : typeof data["amount"] === "number"
                  ? (data["amount"] as number)
                  : null;
            const currency =
              typeof data["currency"] === "string"
                ? (data["currency"] as string).toUpperCase()
                : "EUR";
            const customer =
              data["user"] ?? data["customer"] ?? data["buyer"] ?? data["billing_details"];
            const buyerEmail =
              customer && typeof customer === "object"
                ? ((customer as Record<string, unknown>)["email"] as string | undefined) ?? null
                : null;
            const match = Object.entries(PRODUCTS).find(
              ([, p]) => p.amount === totalAmount && p.currency === currency,
            );

            if (orderId && typeof totalAmount === "number") {
              const { sendTikTokPurchase } = await import("@/lib/tiktok-capi.server");
              const result = await sendTikTokPurchase({
                eventId: `cooud-order-${orderId}`,
                email: buyerEmail,
                value: totalAmount / 100,
                currency,
                productId: match?.[0] ?? null,
                url: "https://premitiktok.lovable.app/",
              });

              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              await supabaseAdmin.from("payment_events").insert({
                source: "tiktok_capi",
                event_type: "purchase",
                product_id: match?.[0] ?? null,
                session_id: orderId,
                amount: totalAmount,
                currency,
                code: result.ok ? "ok" : result.reason,
                message: result.ok
                  ? "Purchase enviado ao TikTok"
                  : "Falha ao enviar Purchase ao TikTok",
              });
              console.info("[Cooud webhook] TikTok CAPI", { orderId, ...result });
            }
          } catch (error) {
            console.error("[Cooud webhook] falha ao enviar Purchase ao TikTok", error);
          }
        }

        return Response.json({ received: true, paid });
      },
    },
  },
});