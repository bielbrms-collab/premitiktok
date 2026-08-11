import { useEffect } from "react";
import { ttqTrack } from "./tiktok-pixel";

type PurchaseOptions = {
  productId: string;
};

/**
 * Dispara o evento Purchase do TikTok APENAS após confirmação real do pagamento.
 * O callback da Cooud só redireciona após onSuccess.
 * Usa checkout_session_id como event_id para deduplicação.
 * - Deduplica no navegador via sessionStorage.
 */
export function useTikTokPurchase({ productId }: PurchaseOptions) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const checkoutSessionId = params.get("checkout_session_id");
        const redirectStatus = params.get("redirect_status");
        if (!checkoutSessionId || redirectStatus !== "succeeded") return;

        const dedupeKey = `ttq_purchase_${checkoutSessionId}`;
        if (sessionStorage.getItem(dedupeKey)) return;
        if (cancelled) return;

        const values: Record<string, number> = {
          "01KZ7W13DD2MVBGG66NPG9EA9T": 19.9,
          "43ca5d35-3492-4567-913d-dc2843ba6931": 12.44,
          "65009b71-7660-44ef-ba87-24f29c7599a4": 19.9,
        };
        const value = values[productId] ?? 0;

        sessionStorage.setItem(dedupeKey, "1");
        ttqTrack(
          "Purchase",
          {
            content_id: productId,
            content_type: "product",
            content_name: "Produto",
            quantity: 1,
            price: value,
            value,
            currency: "EUR",
          },
          checkoutSessionId,
        );
      } catch (err) {
        console.error("TikTok Purchase tracking failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);
}
