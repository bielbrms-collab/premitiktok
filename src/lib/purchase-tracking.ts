import { useEffect } from "react";
import { ttqTrack } from "./tiktok-pixel";
import { PRODUCTS } from "./cooud-products";

type PurchaseOptions = {
  productId: string;
};

function productValue(productId: string) {
  const product = PRODUCTS[productId];
  return product ? product.amount / 100 : 0;
}

/**
 * Dispara o evento Purchase do TikTok de forma idempotente.
 * Deduplicado por sessão de checkout via sessionStorage + event_id.
 */
export function trackPurchase(checkoutSessionId: string, productId: string) {
  if (typeof window === "undefined") return;
  try {
    const dedupeKey = `ttq_purchase_${checkoutSessionId}`;
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, "1");

    const product = PRODUCTS[productId];
    const value = productValue(productId);

    ttqTrack(
      "Purchase",
      {
        content_id: productId,
        content_type: "product",
        content_name: product?.name ?? "Produto",
        quantity: 1,
        price: value,
        value,
        currency: (product?.currency ?? "EUR").toUpperCase(),
      },
      checkoutSessionId,
    );
  } catch (err) {
    console.error("TikTok Purchase tracking failed", err);
  }
}

/**
 * Dispara o Purchase quando o comprador volta para uma página de retorno
 * com os parâmetros da Cooud na URL. Usa o productId da URL quando presente.
 */
export function useTikTokPurchase({ productId }: PurchaseOptions) {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const redirectStatus = params.get("redirect_status");
      if (redirectStatus && redirectStatus !== "succeeded") return;

      const checkoutSessionId =
        params.get("checkout_session_id") ??
        params.get("session_id") ??
        params.get("id");
      if (!checkoutSessionId) return;

      const urlProductId = params.get("productId");
      trackPurchase(checkoutSessionId, urlProductId && PRODUCTS[urlProductId] ? urlProductId : productId);
    } catch (err) {
      console.error("TikTok Purchase tracking failed", err);
    }
  }, [productId]);
}
