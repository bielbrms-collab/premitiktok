import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";
import { captureTikTokAttribution } from "@/lib/tiktok-attribution";

export const Route = createFileRoute("/pressel")({
  head: () => ({
    meta: [
      { title: "Verifica della tua attività | TikTok Ricompense" },
      {
        name: "description",
        content: "Convalida i criteri di attività per proseguire con il prelievo del tuo saldo.",
      },
      { property: "og:title", content: "Verifica della tua attività | TikTok Ricompense" },
      {
        property: "og:description",
        content: "Convalida i criteri di attività per proseguire con il prelievo del tuo saldo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pressel,
});

function Pressel() {
  const metrics = [
    { label: "Video guardati", target: 50 },
    { label: "Tempo trascorso sulla piattaforma", target: 1000 },
    { label: "Video apprezzati", target: 100 },
  ];

  const DURATION = 1800;
  const STAGGER = 500;
  const [values, setValues] = useState<number[]>(() => metrics.map(() => 0));
  const [done, setDone] = useState(false);

  useEffect(() => {
    captureTikTokAttribution();
    const rafs: number[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    metrics.forEach((m, i) => {
      const to = setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / DURATION);
          const v = Math.round(easeOut(p) * m.target);
          setValues((prev) => {
            const next = [...prev];
            next[i] = v;
            return next;
          });
          if (p < 1) rafs.push(requestAnimationFrame(tick));
          else if (i === metrics.length - 1) setDone(true);
        };
        rafs.push(requestAnimationFrame(tick));
      }, i * STAGGER);
      timeouts.push(to);
    });

    return () => {
      rafs.forEach(cancelAnimationFrame);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative dots */}
      <span className="absolute top-10 left-8 h-2 w-2 rounded-full bg-rose-300/70" />
      <span className="absolute top-24 right-16 h-3 w-3 rounded-full bg-sky-400/70" />
      <span className="absolute bottom-24 left-16 h-2.5 w-2.5 rounded-full bg-rose-300/70" />
      <span className="absolute bottom-16 right-10 h-2 w-2 rounded-full bg-sky-400/70" />

      <section className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8">
        <img
          src={tiktokLogo.url}
          alt=""
          aria-hidden="true"
          className="mx-auto mb-6 h-16 w-auto object-contain"
        />
        {/* Headline */}
        <h1 className="text-2xl sm:text-[26px] font-black leading-tight mb-3">
          Soddisfi tutti i{" "}
          <span className="text-rose-500">criteri di attività.</span>
        </h1>
        <p className="text-sm text-neutral-600 mb-5">
          Confermiamo che il tuo account soddisfa i requisiti minimi di utilizzo. Consulta il riepilogo qui sotto, poi sblocca il tuo avanzamento.
        </p>

        {/* Details card */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 mb-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Dettaglio della tua attività
          </div>
          <div className="space-y-3">
            {metrics.map((m, i) => {
              const current = values[i];
              const pct = (current / m.target) * 100;
              const complete = current >= m.target;
              return (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-700">{m.label}</span>
                    <span
                      className={`font-bold transition-colors duration-300 ${
                        complete ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {current}/{m.target}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-[width] duration-100 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p
          className={`text-center text-xs mb-4 transition-opacity duration-500 ${
            done ? "opacity-100 text-emerald-600" : "opacity-0"
          }`}
        >
          Fatto! La tua attività è stata verificata.
        </p>

        {/* CTA */}
        <button
          type="button"
          disabled={!done}
          onClick={() => {
            window.location.href = "/";
          }}
          className={`w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-[0.99] text-white font-bold py-4 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all duration-500 ${
            done
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          Continua
        </button>

        <p className="text-center text-[11px] text-neutral-400 mt-4 leading-snug">
          Questi dati vengono generati automaticamente in base alla tua attività recente sulla piattaforma.
        </p>
      </section>
    </main>
  );
}
