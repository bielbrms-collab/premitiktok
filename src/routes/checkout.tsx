import { createFileRoute } from "@tanstack/react-router";
import { CooudCheckout } from "@/components/CooudCheckout";
import { DEFAULT_PRODUCT_ID } from "@/lib/checkout-config";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finaliser ma commande | Paiement sécurisé" },
      { name: "description", content: "Finalisez votre commande en toute sécurité, paiement chiffré." },
      { property: "og:title", content: "Finaliser ma commande | Paiement sécurisé" },
      { property: "og:description", content: "Paiement sécurisé et chiffré, sans quitter la page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const productId =
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("productId")) ||
    DEFAULT_PRODUCT_ID;

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-white px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-5 text-center text-2xl font-black text-neutral-900">Finaliser ma commande</h1>
        <CooudCheckout productId={productId} returnPath="/up1" />
      </div>
    </main>
  );
}