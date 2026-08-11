import { useEffect, useRef, useState } from "react";
import { formatPrice, loadCooudElements } from "@/lib/checkout-config";

export interface CooudCheckoutProps {
  productId: string;
  className?: string;
  showSummary?: boolean;
  returnPath?: string;
}

type CheckoutBootstrap = {
  sessionId: string;
  elementToken: string;
  sessionSecret: string;
  appearance?: { appearance?: { theme?: "auto" | "light" | "dark" } };
  product: { name: string; amount: number; currency: string };
  error?: string;
  message?: string;
  requestId?: string;
  details?: { message?: string; code?: string };
};

type CooudElements = {
  mount: (options: {
    container: HTMLElement;
    sessionId: string;
    elementToken: string;
    sessionSecret: string;
    appearance?: { theme?: "auto" | "light" | "dark" };
    apiBaseUrl: string;
    compatDate: string;
    onSuccess: () => void;
    onError: (error: { code?: string; message?: string }) => void;
  }) => () => void;
};

function errorMessage(data: CheckoutBootstrap, fallback: string) {
  const detail = data.details?.message ?? data.message;
  const code = data.details?.code ?? data.error;
  const requestId = data.requestId ? ` · request_id: ${data.requestId}` : "";
  return detail ? `${detail}${code ? ` (${code})` : ""}${requestId}` : fallback;
}

export function CooudCheckout({
  productId,
  className,
  showSummary = true,
  returnPath = "/obrigado",
}: CooudCheckoutProps) {
  const [email, setEmail] = useState("");
  const [config, setConfig] = useState<CheckoutBootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const unmountRef = useRef<(() => void) | null>(null);

  useEffect(() => () => unmountRef.current?.(), []);

  async function prepareCheckout() {
    if (!email.trim() || loading) {
      if (!email.trim()) setError("Introduce tu email para recibir el acceso.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/public/cooud/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          buyerEmail: email.trim(),
          quantity: 1,
          origin: window.location.origin,
          returnPath,
        }),
      });
      const raw = await response.text();
      let data: CheckoutBootstrap;
      try {
        data = JSON.parse(raw) as CheckoutBootstrap;
      } catch {
        throw new Error(
          `El servidor devolvió una respuesta no válida (HTTP ${response.status}). Publica la última versión del sitio e inténtalo de nuevo.`,
        );
      }
      if (!response.ok) throw new Error(errorMessage(data, "No se pudo crear la sesión de pago."));

      const cooud = (await loadCooudElements()) as CooudElements;
      const container = containerRef.current;
      if (!container) throw new Error("No se encontró el contenedor de Cooud Elements.");

      unmountRef.current?.();
      unmountRef.current = cooud.mount({
        container,
        sessionId: data.sessionId,
        elementToken: data.elementToken,
        sessionSecret: data.sessionSecret,
        appearance: data.appearance?.appearance ?? { theme: "light" },
        apiBaseUrl: "https://api.cooud.com",
        compatDate: "2026-09-01",
        onSuccess: () => {
          const successUrl = new URL(returnPath, window.location.origin);
          successUrl.searchParams.set("checkout_session_id", data.sessionId);
          successUrl.searchParams.set("productId", productId);
          successUrl.searchParams.set("redirect_status", "succeeded");
          window.location.assign(successUrl.toString());
        },
        onError: (cooudError) => {
          setError(
            `${cooudError.message ?? "No se pudo procesar el pago."}${cooudError.code ? ` (${cooudError.code})` : ""}`,
          );
        },
      });
      setConfig(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el pago.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`rounded-3xl bg-white p-5 text-left shadow-xl sm:p-6 ${className ?? ""}`}>
      {showSummary && config && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
          <p className="text-sm font-bold text-neutral-800">{config.product.name}</p>
          <span className="shrink-0 text-base font-black text-rose-500">
            {formatPrice(config.product.amount, config.product.currency)}
          </span>
        </div>
      )}

      {!config && (
        <>
          <label className="mb-1 block text-sm font-semibold text-neutral-700" htmlFor={`cooud-email-${productId}`}>
            Tu email
          </label>
          <input
            id={`cooud-email-${productId}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => void prepareCheckout()}
            disabled={loading}
            className="mb-4 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-4 font-bold text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 disabled:opacity-50"
          >
            {loading ? "Preparando pago…" : "Continuar al pago"}
          </button>
        </>
      )}

      <div ref={containerRef} className={config ? "min-h-[180px]" : "hidden min-h-[180px]"} />
      {error && <p className="mt-3 text-sm font-medium text-rose-600" role="alert">{error}</p>}
      <p className="mt-4 text-center text-[11px] leading-snug text-neutral-400">
        Pago seguro procesado por Cooud. Los datos de tu tarjeta nunca pasan por nuestros servidores.
      </p>
    </section>
  );
}