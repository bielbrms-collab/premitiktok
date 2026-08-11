import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const API_BASE = "https://api.cooud.com/v2";
const COMPAT_DATE = "2026-09-01";

type ResolvedProduct = { name: string; amount: number; currency: string };

type CatalogPrice = ResolvedProduct & { id: string };

/**
 * Lê o produto real na Cooud. Nada de preço fixo no código: o valor cobrado
 * precisa ser exatamente o configurado no painel para aquele product_id.
 */
function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function resolveProduct(raw: Record<string, unknown>): ResolvedProduct | null {
  const product = (raw["product"] as Record<string, unknown> | undefined) ?? raw;
  const price =
    (product["default_price"] as Record<string, unknown> | undefined) ??
    (product["price"] as Record<string, unknown> | undefined) ??
    (Array.isArray(product["prices"])
      ? ((product["prices"] as Record<string, unknown>[])[0] ?? {})
      : {});

  const amount = pickNumber(
    product["amount"],
    product["unit_amount"],
    price["amount"],
    price["unit_amount"],
  );
  if (amount === null) return null;

  const currency =
    (typeof product["currency"] === "string" && product["currency"]) ||
    (typeof price["currency"] === "string" && price["currency"]) ||
    "EUR";

  const name =
    (typeof product["name"] === "string" && product["name"]) ||
    (typeof product["title"] === "string" && product["title"]) ||
    "Producto";

  return { name, amount, currency: currency.toUpperCase() };
}

function normalizeCatalogId(id: string, prefix: "prod" | "price"): string {
  return id.startsWith(`${prefix}_`) ? id : `${prefix}_${id}`;
}

function firstRecord(raw: CooudError): Record<string, unknown> | null {
  const candidates = [raw["data"], raw["prices"], raw["items"]];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate[0] && typeof candidate[0] === "object") {
      return candidate[0] as Record<string, unknown>;
    }
  }
  return null;
}

function resolveCatalogPrice(raw: CooudError, productName: string): CatalogPrice | null {
  const price = firstRecord(raw) ?? (raw as Record<string, unknown>);
  const id = typeof price["id"] === "string" ? price["id"] : null;
  const amount = pickNumber(price["unit_amount"], price["amount"]);
  const currency = typeof price["currency"] === "string" ? price["currency"] : null;
  if (!id || !amount || !currency) return null;
  return { id, name: productName, amount, currency: currency.toUpperCase() };
}

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
          // O valor vem do Price nativo do catálogo. A API v2 exige os prefixos
          // prod_/price_; o painel também pode exibir apenas a parte ULID.
          const catalogProductId = normalizeCatalogId(parsed.data.productId, "prod");
          const baseSessionPayload = {
            ui_mode: "custom",
            customer_email: parsed.data.buyerEmail,
            success_url: successUrl.toString(),
            cancel_url: cancelUrl.toString(),
            allowed_origins: [checkoutOrigin],
            metadata: { product_id: catalogProductId },
          };

          async function createSession(priceId: string) {
            const response = await fetch(`${API_BASE}/checkout-sessions`, {
              method: "POST",
              headers: { ...commonHeaders, "Idempotency-Key": crypto.randomUUID() },
              body: JSON.stringify({ ...baseSessionPayload, prices: [priceId] }),
            });
            return { response, body: await readBody(response) };
          }

          const productResponse = await fetch(
            `${API_BASE}/products/${encodeURIComponent(catalogProductId)}`,
            { headers: commonHeaders },
          );
          const productBody = await readBody(productResponse);
          const productRecord = (productBody["product"] as Record<string, unknown> | undefined) ?? productBody;
          const productName = typeof productRecord["name"] === "string" ? productRecord["name"] : "Producto";

          if (!productResponse.ok) {
            console.error("[Cooud v2] catalog lookup failed", {
              status: productResponse.status,
              productId: catalogProductId,
              requestId: cooudRequestId(productBody, productResponse),
              response: productBody,
            });
            return json(
              {
                error: "cooud_product_lookup_failed",
                status: productResponse.status,
                requestId: cooudRequestId(productBody, productResponse),
                details: productBody.error ?? productBody,
              },
              502,
            );
          }

          const pricesResponse = await fetch(
            `${API_BASE}/products/${encodeURIComponent(catalogProductId)}/prices`,
            { headers: commonHeaders },
          );
          const pricesBody = await readBody(pricesResponse);
          const catalogPrice = pricesResponse.ok ? resolveCatalogPrice(pricesBody, productName) : null;
          if (!catalogPrice) {
            console.error("[Cooud v2] price lookup failed", {
              status: pricesResponse.status,
              productId: catalogProductId,
              requestId: cooudRequestId(pricesBody, pricesResponse),
              response: pricesBody,
            });
            return json(
              {
                error: "cooud_price_lookup_failed",
                status: pricesResponse.status,
                requestId: cooudRequestId(pricesBody, pricesResponse),
                details: pricesBody.error ?? pricesBody,
              },
              502,
            );
          }

          const attempt = await createSession(normalizeCatalogId(catalogPrice.id, "price"));
          const sessionResponse = attempt.response;
          const session = attempt.body;
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

          // Nome/valor exibidos no resumo vêm da própria sessão criada pela Cooud.
          const sessionLineItem = Array.isArray(session["line_items"])
            ? ((session["line_items"] as Record<string, unknown>[])[0] ?? {})
            : {};
          const displayProduct =
            resolveProduct(sessionLineItem) ??
            catalogPrice;

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
          return json({
            sessionId: session.id,
            elementToken: config.cooud_element_token,
            sessionSecret: config.cooud_session_secret,
            appearance: config.element,
            product: displayProduct,
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