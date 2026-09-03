import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ensureDeliverable, lookupDeliverableByEmail } from "@/lib/deliverable.functions";
import { PHRASES, STEP_TITLES, type DeliverableState } from "@/lib/deliverable-content";

export const SESSION_STORAGE_KEY = "tk_deliverable_session";
export const EMAIL_STORAGE_KEY = "tk_deliverable_email";

export const Route = createFileRoute("/entregavel")({
  head: () => ({
    meta: [
      { title: "Monitoraggio del tuo accesso | TikTok Ricompense" },
      {
        name: "description",
        content:
          "Consulta lo stato, l'avanzamento e il calendario di sblocco del tuo accesso.",
      },
      { property: "og:title", content: "Monitoraggio del tuo accesso | TikTok Ricompense" },
      {
        property: "og:description",
        content: "Stato, avanzamento e data prevista di sblocco del tuo accesso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EntregavelPage,
});

function readSessionId(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const fromUrl =
    params.get("s") ?? params.get("checkout_session_id") ?? params.get("session_id");
  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
  return stored || fromUrl;
}

function EntregavelPage() {
  const ensure = useServerFn(ensureDeliverable);
  const lookupByEmail = useServerFn(lookupDeliverableByEmail);
  const [state, setState] = useState<DeliverableState | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = readSessionId();
    const storedEmail =
      typeof window !== "undefined" ? window.localStorage.getItem(EMAIL_STORAGE_KEY) : null;
    if (!sessionId) {
      if (storedEmail) {
        let active = true;
        lookupByEmail({ data: { email: storedEmail } })
          .then((result) => {
            if (!active) return;
            setState(result);
            setStatus("ready");
          })
          .catch(() => active && setStatus("missing"));
        return () => {
          active = false;
        };
      }
      setStatus("missing");
      return;
    }
    let active = true;
    ensure({ data: { sessionId } })
      .then((result) => {
        if (!active) return;
        window.localStorage.setItem(SESSION_STORAGE_KEY, result.sessionId);
        setState(result);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [ensure, lookupByEmail]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFormError("Inserisci un indirizzo e-mail valido.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await lookupByEmail({ data: { email: value } });
      window.localStorage.setItem(EMAIL_STORAGE_KEY, value);
      setState(result);
      setStatus("ready");
    } catch {
      setFormError("Impossibile consultare il tuo prelievo. Riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#f7f8fa] bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(254,44,85,0.10),transparent_60%),radial-gradient(900px_500px_at_90%_0%,rgba(37,244,238,0.10),transparent_55%)] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto w-full max-w-[560px]">
        <Brand />

        <section className="rounded-[22px] border border-[#eceef1] bg-white px-5 py-7 shadow-[0_24px_60px_-30px_rgba(22,24,35,0.28)] sm:px-7">
          {status === "loading" && <Loading />}
          {status === "missing" && (
            <EmailGate
              email={email}
              onEmailChange={setEmail}
              onSubmit={handleEmailSubmit}
              submitting={submitting}
              error={formError}
            />
          )}
          {status === "error" && (
            <p className="py-10 text-center text-sm text-neutral-500">
              Impossibile mostrare il tuo monitoraggio al momento. Aggiorna la pagina tra qualche secondo.
            </p>
          )}
          {status === "ready" && state && <Tracking state={state} />}
        </section>

        <p className="mx-auto mt-5 max-w-[420px] text-center text-[12px] leading-relaxed text-neutral-400">
          Ambiente 100% sicuro · Il tuo avanzamento viene registrato automaticamente e continua
          anche se chiudi questa pagina.
        </p>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center justify-center gap-2 py-4 pb-6">
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7 text-[#161823]">
        <path d="M22.5 6.3c-1.4-1-2.2-2.5-2.4-4.1h-3.9v16.9c0 1.9-1.6 3.5-3.5 3.5s-3.5-1.6-3.5-3.5 1.6-3.5 3.5-3.5c.4 0 .7.1 1 .2v-4c-.3 0-.7-.1-1-.1-4.1 0-7.4 3.3-7.4 7.4s3.3 7.4 7.4 7.4 7.4-3.3 7.4-7.4v-8.6c1.5 1.1 3.4 1.7 5.4 1.7v-3.9c-1 0-2-.3-2.9-.9z" />
      </svg>
      <span className="text-2xl font-extrabold tracking-tight text-[#161823]">TikTok</span>
    </div>
  );
}

function Eyebrow({ children, live = false }: { children: React.ReactNode; live?: boolean }) {
  return (
    <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
      <span className="relative flex h-[7px] w-[7px]">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span
          className={`relative inline-flex h-[7px] w-[7px] rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(244,180,0,0.15)] ${live ? "animate-pulse" : ""}`}
        />
      </span>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="space-y-4 py-6">
      <div className="mx-auto h-4 w-40 animate-pulse rounded-full bg-neutral-100" />
      <div className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
      <div className="h-3 animate-pulse rounded-full bg-neutral-100" />
      <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
    </div>
  );
}

function EmailGate({
  email,
  onEmailChange,
  onSubmit,
  submitting,
  error,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="py-2 text-center">
      <div className="mx-auto mb-6 grid h-[112px] w-[112px] place-items-center rounded-full border border-dashed border-[#f3d3dc] bg-[radial-gradient(circle,rgba(254,44,85,0.07),transparent_70%)]">
        <div className="grid h-[74px] w-[74px] place-items-center rounded-full bg-white shadow-[0_10px_25px_-14px_rgba(22,24,35,0.5)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-[#25F4EE]"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
      </div>

      <Eyebrow>Monitoraggio prelievo</Eyebrow>
      <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#161823]">
        Inserisci la tua <span className="text-[#FE2C55]">e-mail</span>
      </h1>
      <p className="mx-auto mt-3 max-w-[360px] text-[14.5px] leading-relaxed text-neutral-500">
        Indica l'indirizzo e-mail utilizzato al momento dell'ordine per consultare lo stato del tuo prelievo.
      </p>

      <form onSubmit={onSubmit} className="mt-6 text-left">
        <label
          htmlFor="deliverable-email"
          className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400"
        >
          E-mail associata
        </label>
        <div className="flex items-center gap-3 rounded-[14px] border border-[#eceef1] bg-white px-4 shadow-[0_8px_24px_-20px_rgba(22,24,35,0.6)] focus-within:border-[#FE2C55]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-neutral-400"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <input
            id="deliverable-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="tu@email.com"
            className="h-14 w-full bg-transparent text-[15px] text-[#161823] outline-none placeholder:text-neutral-300"
          />
        </div>
        {error && <p className="mt-2 text-[12.5px] font-semibold text-[#FE2C55]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[15px] bg-gradient-to-r from-[#ff3a63] via-[#fe2c55] to-[#e51e46] text-[13.5px] font-extrabold uppercase tracking-wide text-white shadow-[0_16px_30px_-12px_rgba(254,44,85,0.7)] transition active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Ricerca in corso..." : "Continua con questa e-mail →"}
        </button>
      </form>

      <p className="mx-auto mt-4 max-w-[400px] text-[12px] leading-relaxed text-neutral-400">
        Continuando, vedrai lo stato in tempo reale e la data prevista del versamento.
      </p>
    </div>
  );
}

function Tracking({ state }: { state: DeliverableState }) {
  const index = state.day - 1;

  return (
    <div>
      <Eyebrow live>Stato dello sblocco</Eyebrow>
      {state.email && (
        <div className="mb-4 break-all text-center text-[12.5px] text-neutral-500">
          Monitoraggio associato a <b className="text-[#161823]">{state.email}</b>
        </div>
      )}

      <div className="relative mb-5 mt-1 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#161823] to-[#2a2d3d] px-5 py-5 text-center text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(254,44,85,0.55),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(37,244,238,0.4),transparent_70%)]" />
        <div className="relative text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7cad6]">
          {state.released ? "Accesso sbloccato" : "Sblocco in corso"}
        </div>
        <div className="relative my-1 text-[34px] font-extrabold leading-none">
          Giorno {state.day}
          <span className="text-[18px] font-bold text-[#c7cad6]">/{state.totalDays}</span>
        </div>
        <div className="relative mt-2 inline-flex items-center gap-2 text-[12.5px] font-bold text-[#25F4EE]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#25F4EE]" />
          {state.released ? "Pronto per essere consultato" : "Sblocco in elaborazione"}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-[12.5px] text-neutral-500">
        <span>Avanzamento dello sblocco</span>
        <b className="text-[#161823]">{state.progress}%</b>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f0f1f4]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#25F4EE] via-[#FE2C55] to-[#e51e46] transition-[width] duration-700"
          style={{ width: `${state.progress}%` }}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-[#eceef1] bg-[#fbfbfc] px-4 py-4">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#16c784]" />
          Giorno {state.day} di {state.totalDays}
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">{PHRASES[index]}</p>
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
          Massimo 4 giorni lavorativi affinché il tuo pagamento venga completato e accreditato sul
          tuo conto.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-[#eceef1] bg-white px-4 py-3 text-center shadow-[0_8px_24px_-20px_rgba(22,24,35,0.2)]">
        <p className="text-[11.5px] font-medium leading-relaxed tracking-wide text-neutral-500">
          Equipe Suporte TikTok agradece sua solicitação
        </p>
      </div>

      {state.released && (
        <a
          href="https://drive.google.com/"
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[15px] bg-gradient-to-r from-[#ff3a63] via-[#fe2c55] to-[#e51e46] text-[15px] font-extrabold uppercase tracking-wide text-white shadow-[0_16px_30px_-12px_rgba(254,44,85,0.7)] transition active:scale-[0.99]"
        >
          Accedi ora →
        </a>
      )}

      <div className="mt-7 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
        Cronologia
      </div>

      <div className="mt-3">
        {STEP_TITLES.map((title, i) => {
          const done = i < index;
          const current = i === index;
          const isLast = i === STEP_TITLES.length - 1;
          return (
            <div key={title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold animate-pulse",
                    done
                      ? "bg-[#16c784] text-white"
                      : current
                        ? "bg-[#FE2C55] text-white shadow-[0_0_0_5px_rgba(254,44,85,0.15)]"
                        : "border border-[#eceef1] bg-white text-neutral-400",
                  ].join(" ")}
                >
                  {done ? "✓" : isLast ? "★" : i + 1}
                </div>
                {!isLast && (
                  <div className={`w-[2px] flex-1 ${done ? "bg-[#16c784]" : "bg-[#eceef1]"}`} />
                )}
              </div>
              <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Giorno {i + 1}
                </div>
                <div
                  className={`text-[14.5px] font-semibold ${
                    current ? "text-[#FE2C55]" : done ? "text-[#161823]" : "text-neutral-400"
                  }`}
                >
                  {title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
