import { createFileRoute } from "@tanstack/react-router";
import { CooudCheckout } from "@/components/CooudCheckout";
import { DEFAULT_PRODUCT_ID } from "@/lib/checkout-config";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar compra | Pago seguro Cooud" },
      { name: "description", content: "Completa tu compra de forma segura con Cooud Elements." },
      { property: "og:title", content: "Finalizar compra | Pago seguro Cooud" },
      { property: "og:description", content: "Pago seguro integrado con Cooud Elements." },
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
        <h1 className="mb-5 text-center text-2xl font-black text-neutral-900">Finalizar compra</h1>
        <CooudCheckout productId={productId} />
      </div>
    </main>
  );
}