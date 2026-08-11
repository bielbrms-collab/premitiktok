// ID do produto padrão. Pode ser sobrescrito por ?productId=... na URL.
export const DEFAULT_PRODUCT_ID = "01KZ7W13DD2MVBGG66NPG9EA9T";

// Produto da oferta de back-redirect.
export const BACK_REDIRECT_PRODUCT_ID = "43ca5d35-3492-4567-913d-dc2843ba6931";

// Produto do upsell /up1 (página "El pago no se ha completado").
export const UP1_PRODUCT_ID = "65009b71-7660-44ef-ba87-24f29c7599a4";

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: (currency || "eur").toUpperCase(),
  }).format(cents / 100);
}

let cooudElementsPromise: Promise<unknown> | null = null;

export function loadCooudElements(): Promise<unknown> {
  if (cooudElementsPromise) return cooudElementsPromise;
  cooudElementsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    const current = window as typeof window & { __CooudElements__?: unknown };
    if (current.__CooudElements__) return resolve(current.__CooudElements__);
    const existing = document.querySelector<HTMLScriptElement>("script[data-cooud-elements]");
    if (existing) {
      existing.addEventListener("load", () => {
        const loaded = (window as typeof window & { __CooudElements__?: unknown }).__CooudElements__;
        loaded ? resolve(loaded) : reject(new Error("Cooud Elements no se inicializó."));
      });
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Cooud Elements.")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.cooud.com/cdn/elements/v1.js";
    s.async = true;
    s.dataset.cooudElements = "true";
    s.onload = () => {
      const loaded = (window as typeof window & { __CooudElements__?: unknown }).__CooudElements__;
      loaded ? resolve(loaded) : reject(new Error("Cooud Elements no se inicializó."));
    };
    s.onerror = () => reject(new Error("No se pudo cargar Cooud Elements."));
    document.head.appendChild(s);
  });
  return cooudElementsPromise;
}
