import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PRODUCTS } from "@/lib/cooud-products";

const API_BASE = "https://api.cooud.com/v2";
const COMPAT_DATE = "2026-09-01";

const requestSchema = z.object({
  productId: z.string().min(1),
  buyerEmail: z.string().email(),
  quantity: z.number().int().min(1).max(10).default(1),
  origin: z.string().url(),
  returnPath: z.string().startsWith("/").max(200).default("/up1"),
});

type CooudError = {
  type?: string;
  code?: string;
  message?: string;
  request_id?: string;
  error?: CooudError;
  [key: string]: unknown;
};

async function readBody(response: Response): Promise<CooudError> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as CooudError;
  } catch {
    return { message: text };
  }
}

function cooudRequestId(body: CooudError, response: Response) {
  return response.headers.get("x-request-id") ?? body.request_id ?? body.error?.request_id;
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/cooud/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return json({ error: "invalid_request", details: parsed.error.flatten() }, 400);
        }

        const product = PRODUCTS[parsed.data.productId];
        if (!product) return json({ error: "unknown_product" }, 400);

        const apiKey = process.env["COOUD_SECRET_KEY"];
        if (!apiKey) {
          console.error("[Cooud v2] COOUD_SECRET_KEY ausente no backend");
          return json({ error: "cooud_not_configured" }, 500);
        }

        const checkoutOrigin = new URL(parsed.data.origin).origin;
        const successUrl = new URL(parsed.data.returnPath, checkoutOrigin);
        const cancelUrl = new URL("/pressel/index.html#ten", checkoutOrigin);
        const commonHeaders = {
          Authorization: `Bearer ${apiKey}`,
          "Cooud-Compat-Date": COMPAT_DATE,
          "Content-Type": "application/json",
        };

        try {
          const sessionResponse = await fetch(`${API_BASE}/checkout-sessions`, {
            method: "POST",
            headers: {
              ...commonHeaders,
              "Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify({
              ui_mode: "custom",
              // `prices` e `line_items` são mutuamente exclusivos na API v2.
              ...(product.priceId
                ? { prices: [product.priceId] }
                : {
                    line_items: [
                      {
                        name: product.cooudLabel,
                        amount: product.amount,
                        currency: product.currency,
                        quantity: parsed.data.quantity,
                        delivery: { mode: "external" },
                      },
                    ],
                  }),
              customer_email: parsed.data.buyerEmail,
              success_url: successUrl.toString(),
              cancel_url: cancelUrl.toString(),
              allowed_origins: [checkoutOrigin],
              metadata: {
                product_id: parsed.data.productId,
                offer: product.cooudLabel,
                return_path: parsed.data.returnPath,
                ...(product.priceId ? { price_id: product.priceId } : {}),
              },
            }),
          });

          const session = await readBody(sessionResponse);
          if (!sessionResponse.ok || typeof session.id !== "string") {
            console.error("[Cooud v2] create checkout session failed", {
              status: sessionResponse.status,
              requestId: cooudRequestId(session, sessionResponse),
              response: session,
            });
            return json(
              {
                error: "cooud_session_failed",
                status: sessionResponse.status,
                requestId: cooudRequestId(session, sessionResponse),
                details: session.error ?? session,
              },
              502,
            );
          }

          const configResponse = await fetch(
            `${API_BASE}/checkout-sessions/${encodeURIComponent(session.id)}/element-config`,
            {
              method: "POST",
              headers: commonHeaders,
              body: JSON.stringify({ appearance: { theme: "light" } }),
            },
          );
          const config = await readBody(configResponse);
          if (!configResponse.ok) {
            console.error("[Cooud v2] element config failed", {
              status: configResponse.status,
              sessionId: session.id,
              requestId: cooudRequestId(config, configResponse),
              response: config,
            });
            return json(
              {
                error: "cooud_element_config_failed",
                status: configResponse.status,
                requestId: cooudRequestId(config, configResponse),
                details: config.error ?? config,
              },
              502,
            );
          }

          console.info("[Cooud v2] custom checkout ready", {
            sessionId: session.id,
            requestId: config.request_id,
          });
          // Denominador dos relatórios: uma tentativa iniciada por oferta.
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("payment_events").insert({
              source: "checkout",
              event_type: "session_created",
              product_id: parsed.data.productId,
              offer: product.stage,
              session_id: session.id,
              amount: product.amount,
              currency: product.currency,
            });
          } catch (logError) {
            console.error("[Cooud v2] falha ao registrar sessão", logError);
          }
          // Quando a oferta vem do catálogo, o valor autoritativo é o da sessão.
          const resolvedAmount =
            typeof session.amount === "number" ? session.amount : product.amount;
          const resolvedCurrency =
            typeof session.currency === "string" ? session.currency.toUpperCase() : product.currency;
          return json({
            sessionId: session.id,
            elementToken: config.cooud_element_token,
            sessionSecret: config.cooud_session_secret,
            appearance: config.element,
            product: {
              name: product.name,
              amount: resolvedAmount,
              currency: resolvedCurrency,
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("[Cooud v2] backend fetch failed", { message, error });
          return json({ error: "cooud_network_failed", message }, 502);
        }
      },
    },
  },
});