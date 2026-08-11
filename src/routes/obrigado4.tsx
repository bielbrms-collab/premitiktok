import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, ShieldCheck, Zap, Clock, Users, ArrowRight } from "lucide-react"

export const Route = createFileRoute('/obrigado4')({
  head: () => ({
    meta: [
      { title: "Fila prioritaria | TikTok Rewards" },
      {
        name: "description",
        content: "Oferta exclusiva para acelerar el procesamiento del retiro en la fila prioritaria.",
      },
      { property: "og:title", content: "Fila prioritaria | TikTok Rewards" },
      {
        property: "og:description",
        content: "Oferta exclusiva para acelerar el procesamiento del retiro en la fila prioritaria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Obrigado4Component,
})

function Obrigado4Component() {
  const [step, setStep] = useState(1) // 1: Processamento, 2: Fila, 3: Oferta
  const [progress, setProgress] = useState(0)
  const [queuePosition, setQueuePosition] = useState(327)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutos
  const [spotsLeft, setSpotsLeft] = useState(7)

  useEffect(() => {
    if (step === 1) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => setStep(2), 500)
            return 100
          }
          return prev + 2
        })
      }, 100)
      return () => clearInterval(interval)
    }

    if (step === 2) {
      const interval = setInterval(() => {
        setQueuePosition(prev => {
          if (prev <= 41) {
            clearInterval(interval)
            setTimeout(() => setStep(3), 1500)
            return 41
          }
          return prev - 7
        })
      }, 50)
      return () => clearInterval(interval)
    }

    if (step === 3) {
      const timer = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
      }, 1000)
      
      const spotsTimer = setInterval(() => {
        setSpotsLeft(prev => (prev > 2 ? prev - 1 : prev))
      }, 15000)

      return () => {
        clearInterval(timer)
        clearInterval(spotsTimer)
      }
    }
  }, [step])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusMessage = () => {
    if (progress < 25) return "Validando pago..."
    if (progress < 50) return "Gerando acceso seguro..."
    if (progress < 75) return "Sincronizando con el servidor..."
    return "Finalizando configuración..."
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-red-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {step === 1 && (
          <div className="bg-[#121212] p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                <div 
                  className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"
                  style={{ animationDuration: '1s' }}
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Etapa 1: Procesamiento</h2>
              <p className="text-gray-400 text-sm">{getStatusMessage()}</p>
            </div>
            <div className="space-y-2">
              <Progress value={progress} className="h-2 bg-white/5" />
              <p className="text-right text-xs font-mono text-red-500">{progress}%</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#121212] p-8 rounded-3xl border border-white/5 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-red-600/10 rounded-2xl text-red-500 mb-2">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Fila de Prioridad</h2>
              <p className="text-gray-400">Calculando tu posición actual...</p>
            </div>
            <div className="relative py-8">
              <span className="text-7xl font-black text-white tracking-tighter">
                #{queuePosition}
              </span>
              <div className="absolute inset-0 bg-red-600/5 blur-2xl -z-10" />
            </div>
            <p className="text-sm text-gray-500 italic">No cierres esta ventana</p>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
            <div className="text-center space-y-2 mb-8">
              <div className="inline-block px-4 py-1.5 bg-red-600/10 text-red-500 rounded-full text-xs font-bold uppercase tracking-widest border border-red-600/20 mb-2">
                OFERTA EXCLUSIVA
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-tight">
                ¡LIBERA TU RETIRO <br/> <span className="text-red-600">AHORA MISMO!</span>
              </h2>
            </div>

            <div className="bg-[#121212] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
              {/* Header con contador */}
              <div className="bg-red-600 p-4 flex justify-between items-center px-6">
                <span className="text-xs font-bold uppercase tracking-wider">La oferta termina en:</span>
                <div className="flex items-center gap-2 font-mono text-xl font-black">
                  <Clock className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Benefícios */}
                <div className="space-y-4">
                  {[
                    { icon: Zap, title: "Retiro Inmediato", desc: "Salta la fila de 7 días" },
                    { icon: ShieldCheck, title: "Verificación VIP", desc: "Soporte prioritario 24/7" },
                    { icon: CheckCircle2, title: "Aprobación Garantizada", desc: "Sin burocracia adicional" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 p-1.5 bg-green-500/10 rounded-lg text-green-500">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scarcity */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                  <p className="text-sm font-medium">
                    🔥 SOLO <span className="text-red-500 font-bold">{spotsLeft} VAGAS</span> DISPONIBLES
                  </p>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-1000"
                      style={{ width: `${(spotsLeft / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Button */}
                <button 
                  onClick={() => window.location.href = 'https://pay.3bpagamentos.com.br/WJv5gA8oM9nK'}
                  className="w-full group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-600/20"
                >
                  <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-[45deg] -translate-x-full group-hover:animate-shimmer" />
                  <span className="flex items-center justify-center gap-2 text-lg">
                    🚀 ANTECIPAR MI FILA
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </button>

                <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                  Pago 100% Seguro & Encriptado
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-45deg); }
          100% { transform: translateX(250%) skewX(-45deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
