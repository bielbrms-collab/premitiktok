/**
 * TikTok Events API (server-side) — dispara Purchase direto do servidor.
 * Isso garante que TODA venda aprovada seja contabilizada, mesmo quando o
 * comprador não volta para a thank-you page (maior causa de eventos perdidos).
 */
const EVENTS_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type TikTokPurchaseInput = {
  eventId: string;
  email?: string | null;
  phone?: string | null;
  value: number;
  currency?: string | null;
  productId?: string | null;
  ttclid?: string | null;
  ttp?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  url?: string | null;
  eventTime?: number;
};

export async function sendTikTokPurchase(input: TikTokPurchaseInput) {
  const token = process.env["TIKTOK_ACCESS_TOKEN"];
  const pixelId = process.env["TIKTOK_PIXEL_ID"] ?? "DACEIIJC77UES974F4Q0";
  if (!token) {
    console.warn("[TikTok CAPI] TIKTOK_ACCESS_TOKEN ausente — evento não enviado");
    return { ok: false, reason: "missing_token" as const };
  }

  const user: Record<string, string> = {};
  if (input.email) user.email = await sha256(input.email.trim().toLowerCase());
  if (input.phone) {
    const digits = input.phone.replace(/[^\d+]/g, "");
    if (digits) user.phone = await sha256(digits.startsWith("+") ? digits : `+${digits}`);
  }
  if (input.ttclid) user.ttclid = input.ttclid;
  if (input.ttp) user.ttp = input.ttp;
  if (input.ip) user.ip = input.ip;
  if (input.userAgent) user.user_agent = input.userAgent;

  const body = {
    event_source: "web",
    event_source_id: pixelId,
    data: [
      {
        event: "Purchase",
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        user,
        page: input.url ? { url: input.url } : undefined,
        properties: {
          currency: (input.currency || "EUR").toUpperCase(),
          value: input.value,
          contents: [
            {
              content_id: input.productId ?? "produto",
              content_type: "product",
              content_name: "Produto",
              quantity: 1,
              price: input.value,
            },
          ],
        },
      },
    ],
  };

  try {
    const response = await fetch(EVENTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": token },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error(`[TikTok CAPI] falha HTTP ${response.status}: ${text}`);
      return { ok: false, reason: "http_error" as const, status: response.status, body: text };
    }
    const parsed = JSON.parse(text) as { code?: number; message?: string; request_id?: string };
    if (parsed.code !== 0) {
      console.error("[TikTok CAPI] erro da API", parsed);
      return { ok: false, reason: "api_error" as const, body: text };
    }
    console.info("[TikTok CAPI] Purchase enviado", { eventId: input.eventId, value: input.value });
    return { ok: true as const, requestId: parsed.request_id ?? null };
  } catch (error) {
    console.error("[TikTok CAPI] exceção ao enviar evento", error);
    return { ok: false, reason: "exception" as const };
  }
}
