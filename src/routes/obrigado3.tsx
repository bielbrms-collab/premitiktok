import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";
import { CheckCircle2, Clock, Zap, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/obrigado3")({
  head: () => ({
    meta: [
      { title: "Traitement de votre demande | TikTok Récompenses" },
      {
        name: "description",
        content: "Nous traitons votre demande de retrait.",
      },
      { property: "og:title", content: "Traitement de votre demande" },
      {
        property: "og:description",
        content: "Nous traitons votre demande de retrait.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Obrigado3,
});

function Obrigado3() {
  const [step, setStep] = useState<"processing" | "queue">("processing");
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [queuePosition, setQueuePosition] = useState(327);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [spotsLeft, setSpotsLeft] = useState(7);
  
  const statusMessages = [
    "Vérification du paiement",
    "Génération de l’accès",
    "Réservation de la priorité",
    "Finalisation du processus"
  ];

  const queueSteps = [327, 198, 96, 41];
  const queueIndexRef = useRef(0);

  // Step 1: Processing Progress
  useEffect(() => {
    if (step !== "processing") return;

    const duration = 5000; // 5 seconds
    const interval = 50;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setStep("queue"), 500);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    // Update status messages
    const statusTimer = setInterval(() => {
      setStatusIndex(prev => (prev < statusMessages.length - 1 ? prev + 1 : prev));
    }, duration / statusMessages.length);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [step]);

  // Step 2: Queue Animation
  useEffect(() => {
    if (step !== "queue") return;

    const queueTimer = setInterval(() => {
      if (queueIndexRef.current < queueSteps.length - 1) {
        queueIndexRef.current += 1;
        setQueuePosition(queueSteps[queueIndexRef.current]);
      } else {
        clearInterval(queueTimer);
      }
    }, 2000);

    return () => clearInterval(queueTimer);
  }, [step]);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scarcity Animation
  useEffect(() => {
    const timer = setInterval(() => {
      setSpotsLeft(prev => {
        if (prev <= 2) return prev;
        return Math.random() > 0.7 ? prev - 1 : prev;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === "processing") {
    return (
      <main className="min-h-screen w-full bg-[#000] flex items-center justify-center p-6 font-sans overflow-hidden">
        <div className="w-full max-w-[450px] flex flex-col items-center animate-in fade-in duration-700">
          <img
            src={tiktokLogo.url}
            alt="TikTok"
            className="h-8 w-auto mb-12 brightness-0 invert opacity-60"
          />

          <div className="w-full bg-[#121212] rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
             {/* Subtle shine effect */}
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none" />
             
             <h1 className="text-white text-[24px] font-black text-center mb-2 tracking-tight">
               Nous traitons votre demande...
             </h1>
             <p className="text-neutral-500 text-[14px] text-center mb-10">
               Patientez quelques secondes, nous réservons votre priorité.
             </p>

             {/* Progress Bar Container */}
             <div className="w-full h-3 bg-white/5 rounded-full mb-8 overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#25f4ee] to-[#ff3b5c] transition-all duration-300 ease-out shadow-[0_0_15px_rgba(37,244,238,0.3)]"
                  style={{ width: `${progress}%` }}
                />
             </div>

             {/* Status List */}
             <div className="space-y-4">
                {statusMessages.map((msg, i) => (
                  <div 
                    key={msg} 
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      i <= statusIndex ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                    }`}
                  >
                    <div className={`flex items-center justify-center h-5 w-5 rounded-full ${
                      i <= statusIndex ? "bg-[#25f4ee]/20 text-[#25f4ee]" : "bg-white/5 text-transparent"
                    }`}>
                      <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                    <span className={`text-[14px] font-medium ${
                      i <= statusIndex ? "text-neutral-300" : "text-neutral-700"
                    }`}>
                      {msg}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#000] flex flex-col items-center py-12 px-6 font-sans selection:bg-[#ff3b5c]/30">
      <div className="w-full max-w-[480px] flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Logo */}
        <img
          src={tiktokLogo.url}
          alt="TikTok"
          className="h-8 w-auto mb-10 brightness-0 invert opacity-60"
        />

        {/* Priority Card */}
        <div className="w-full bg-[#121212] rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden mb-8">
           <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

           <div className="text-center mb-8">
             <h2 className="text-white text-[28px] font-black leading-tight mb-4">
               Votre demande a bien été reçue.
             </h2>
             <p className="text-neutral-400 text-[15px] leading-relaxed">
               Votre demande a bien été enregistrée. Elle suit actuellement le processus de déblocage. Pour respecter l’ordre d’arrivée, une file de traitement est en place.
             </p>
           </div>

           {/* Queue Display */}
           <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col items-center mb-8 relative">
              <span className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest mb-1">POSITION DANS LA FILE</span>
              <div className="text-[48px] font-black text-white tabular-nums tracking-tighter transition-all duration-500 scale-110">
                #{queuePosition}
              </div>
              <div className="absolute top-4 right-4 flex gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#25f4ee] animate-pulse" />
                 <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b5c] animate-pulse delay-75" />
              </div>
           </div>

           {/* Priority Offer Section */}
           <div className="border-t border-white/10 pt-8 mt-2">
             <div className="flex items-center justify-center gap-2 mb-4">
               <Zap className="text-[#25f4ee]" size={18} />
               <h3 className="text-white text-[19px] font-bold">Passez devant dans la file.</h3>
             </div>
             
             <p className="text-neutral-400 text-[14px] text-center mb-8">
               Vous pouvez rejoindre la file prioritaire et accélérer le traitement de votre demande. Cette possibilité n’est disponible qu’en ce moment.
             </p>

             {/* Scarcity Banner */}
             <div className="flex items-center justify-center gap-2 bg-[#ff3b5c]/10 rounded-full py-2 px-4 mb-6 border border-[#ff3b5c]/20">
                <AlertCircle className="text-[#ff3b5c]" size={14} />
                <span className="text-[#ff3b5c] text-[12px] font-bold">
                  PLUS QUE {spotsLeft} PLACES PRIORITAIRES DISPONIBLES
                </span>
             </div>

             {/* Benefits List */}
             <div className="grid grid-cols-1 gap-4 mb-10">
                {[
                  { icon: <Clock size={16} />, text: "Traitement prioritaire" },
                  { icon: <Zap size={16} />, text: "Traitement accéléré" },
                  { icon: <ShieldCheck size={16} />, text: "Déblocage plus rapide" },
                  { icon: <Zap size={16} />, text: "Priorité dans la file" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    <div className="text-[#25f4ee]">{item.icon}</div>
                    <span className="text-neutral-300 text-[13px] font-medium">{item.text}</span>
                  </div>
                ))}
             </div>

             {/* Main Button with Shine Effect */}
             <div className="relative group">
                <button
                  onClick={() => window.location.href = "/obrigado4"}
                  className="w-full relative overflow-hidden rounded-2xl bg-[#ff3b5c] py-5 text-[18px] font-black text-white shadow-[0_15px_35px_rgba(255,59,92,0.3)] transition-all active:scale-[0.98] group-hover:brightness-110"

                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    🚀 PASSER EN PRIORITAIRE
                  </span>
                  {/* Glossy animated shine */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
                </button>
             </div>

             {/* Timer */}
             <div className="mt-6 flex flex-col items-center">
                <span className="text-neutral-600 text-[11px] font-bold uppercase tracking-widest mb-1">L’OFFRE EXPIRE DANS</span>
                <span className="text-[#25f4ee] font-mono text-[20px] font-bold tracking-wider">{formatTime(timeLeft)}</span>
             </div>
           </div>
        </div>

        {/* Secondary Button */}
        <button 
          className="text-neutral-600 text-[13px] font-medium hover:text-neutral-400 transition-colors flex items-center gap-2"
          onClick={() => {}}
        >
          Non, je préfère continuer à attendre.
          <ArrowRight size={14} />
        </button>

        {/* CSS for custom animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}} />
      </div>
    </main>
  );
}
