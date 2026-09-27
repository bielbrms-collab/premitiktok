import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitRefundRequest } from "@/lib/deliverable-extras.functions";
import type { DeliverableState } from "@/lib/deliverable-content";

export type DeliverableView = "tracking" | "rewards" | "refund";

// Struttura delle ricompense: da configurare in seguito.
// status: "done" | "available" | "locked" è calcolato in base all'ordine.
export const REWARDS: { title: string; subtitle: string; instructions?: string }[] = [
  { title: "Ricompensa 1", subtitle: "Primo prelievo" },
  {
    title: "Ricompensa 2",
    subtitle: "Nuova ricompensa disponibile",
    instructions: "Le istruzioni per questa ricompensa saranno disponibili a breve.",
  },
  { title: "Ricompensa 3", subtitle: "In arrivo" },
  { title: "Ricompensa 4", subtitle: "In arrivo" },
];

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Apri menu"
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-xl border border-[#eceef1] bg-white text-[#161823] shadow-[0_8px_24px_-20px_rgba(22,24,35,0.6)] transition active:scale-95"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="h-5 w-5">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}

export function SideMenu({
  open,
  onClose,
  view,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  view: DeliverableView;
  onSelect: (v: DeliverableView) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items: { id: DeliverableView; label: string; icon: React.ReactNode }[] = [
    {
      id: "tracking",
      label: "Stato dello sblocco",
      icon: <path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />,
    },
    {
      id: "rewards",
      label: "Ricompense",
      icon: <path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z" />,
    },
    {
      id: "refund",
      label: "Richiedi rimborso",
      icon: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    },
  ];

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[#161823]/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-[82%] max-w-[320px] flex-col bg-white shadow-[-24px_0_60px_-30px_rgba(22,24,35,0.35)] transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-[#eceef1] px-5 py-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">Menu</span>
          <button
            type="button"
            aria-label="Chiudi menu"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-neutral-500 hover:bg-[#f7f8fa]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="h-5 w-5">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {items.map((it) => {
            const active = view === it.id;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onSelect(it.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[14.5px] font-semibold transition ${
                  active ? "bg-[#fff1f4] text-[#FE2C55]" : "text-[#161823] hover:bg-[#f7f8fa]"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
                  {it.icon}
                </svg>
                {it.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="mb-4 text-[12.5px] font-semibold text-neutral-500 hover:text-[#161823]">
      ← Torna allo stato
    </button>
  );
}

export function RewardsView({ state, onBack }: { state: DeliverableState; onBack: () => void }) {
  return (
    <div>
      <BackLink onBack={onBack} />
      <div className="relative mb-6 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#161823] to-[#2a2d3d] px-5 py-5 text-center text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(254,44,85,0.55),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(37,244,238,0.4),transparent_70%)]" />
        <div className="relative text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7cad6]">Totale ricevuto</div>
        <div className="relative mt-1 text-[34px] font-extrabold leading-none">
          € 1.395,72
        </div>
      </div>

      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">Progresso ricompense</div>
      <div className="mt-3">
        {REWARDS.map((r, i) => {
          const status = i === 0 ? "progress" : "locked";
          const isLast = i === REWARDS.length - 1;
          return (
            <div key={r.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold",
                    status === "locked"
                        ? "border border-[#eceef1] bg-white text-neutral-400"
                        : "bg-[#FE2C55] text-white shadow-[0_0_0_5px_rgba(254,44,85,0.15)]",
                  ].join(" ")}
                >
                  {status === "locked" ? "🔒" : i + 1}
                </div>
                {!isLast && <div className="w-[2px] flex-1 bg-[#eceef1]" />}
              </div>
              <div className={isLast ? "pb-0" : "pb-5"}>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{r.title}</div>
                <div className={`text-[14.5px] font-semibold ${status === "locked" ? "text-neutral-400" : "text-[#FE2C55]"}`}>
                  {r.subtitle}
                </div>
                <div className="mt-0.5 text-[12.5px] text-neutral-500">
                  {status === "progress" && "Primeiro saque em processamento"}
                  {status === "locked" && "Bloccata fino al completamento della precedente"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-[14px] border border-[#eceef1] bg-white px-4 text-[15px] text-[#161823] outline-none shadow-[0_8px_24px_-20px_rgba(22,24,35,0.6)] placeholder:text-neutral-300 focus:border-[#FE2C55]";
const labelCls = "mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400";

export function RefundView({ state, onBack }: { state: DeliverableState; onBack: () => void }) {
  const submit = useServerFn(submitRefundRequest);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(state.email ?? "");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Inserisci il tuo nome.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Inserisci un indirizzo e-mail valido.");
    if (!reason) return setError("Seleziona il motivo della richiesta.");
    setError(null);
    setConfirming(true);
  }

  async function confirm() {
    setSending(true);
    try {
      await submit({
        data: { name, email, reason, details: details || undefined, sessionId: state.sessionId },
      });
      setConfirming(false);
      setDone(true);
    } catch {
      setError("Impossibile registrare la richiesta. Riprova.");
      setConfirming(false);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#16c784] text-2xl text-white">✓</div>
        <h2 className="text-[22px] font-extrabold tracking-tight text-[#161823]">Richiesta ricevuta</h2>
        <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-relaxed text-neutral-500">
          La tua richiesta di rimborso è stata registrata con successo. L'elaborazione può richiedere fino a 10 giorni.
        </p>
        <button type="button" onClick={onBack} className="mt-5 text-[13px] font-semibold text-[#FE2C55]">
          ← Torna allo stato
        </button>
      </div>
    );
  }

  return (
    <div>
      <BackLink onBack={onBack} />
      <h2 className="text-center text-[24px] font-extrabold leading-tight tracking-tight text-[#161823]">
        Richiedi <span className="text-[#FE2C55]">rimborso</span>
      </h2>
      <p className="mx-auto mt-2 max-w-[360px] text-center text-[14px] leading-relaxed text-neutral-500">
        Compila il modulo qui sotto per inviare la tua richiesta.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className={labelCls} htmlFor="rf-name">Nome</label>
          <input id="rf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={`${inputCls} h-14`} placeholder="Il tuo nome" />
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-email">E-mail utilizzata per l'acquisto</label>
          <input id="rf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} className={`${inputCls} h-14`} placeholder="tu@email.com" />
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-reason">Motivo della richiesta</label>
          <select id="rf-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} h-14`}>
            <option value="">Seleziona un motivo</option>
            <option>Non ho ricevuto quanto previsto</option>
            <option>Problema con il pagamento</option>
            <option>Acquisto effettuato per errore</option>
            <option>Altro</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-details">Descrivi il problema</label>
          <textarea id="rf-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={3000} rows={4} className={`${inputCls} py-3`} placeholder="Spiegaci cosa è successo..." />
        </div>
        {error && <p className="text-[12.5px] font-semibold text-[#FE2C55]">{error}</p>}
        <button
          type="submit"
          className="flex h-14 w-full items-center justify-center rounded-[15px] bg-gradient-to-r from-[#ff3a63] via-[#fe2c55] to-[#e51e46] text-[13.5px] font-extrabold uppercase tracking-wide text-white shadow-[0_16px_30px_-12px_rgba(254,44,85,0.7)] transition active:scale-[0.99]"
        >
          Richiedi rimborso
        </button>
      </form>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#161823]/35 px-5 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" className="w-full max-w-[400px] rounded-[22px] bg-white p-6 text-center shadow-[0_24px_60px_-20px_rgba(22,24,35,0.45)]">
            <h3 className="text-[18px] font-extrabold text-[#161823]">Sei sicuro di voler richiedere il rimborso?</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">
              Confermando, la tua richiesta di rimborso verrà registrata. L'elaborazione del rimborso può richiedere fino a 10 giorni, secondo la politica di rimborso applicabile.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setConfirming(false)} disabled={sending} className="h-12 rounded-[13px] border border-[#eceef1] bg-white text-[13.5px] font-bold text-[#161823]">
                Annulla
              </button>
              <button type="button" onClick={confirm} disabled={sending} className="h-12 rounded-[13px] bg-[#FE2C55] text-[13.5px] font-bold text-white disabled:opacity-60">
                {sending ? "Invio..." : "Conferma rimborso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
