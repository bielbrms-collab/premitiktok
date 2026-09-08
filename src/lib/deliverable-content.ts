export const TOTAL_DAYS = 6;

export const STEP_TITLES = [
  "Richiesta registrata",
  "Verifica avviata",
  "Convalida d’identità",
  "Preparazione del pagamento",
  "Elaborazione del pagamento",
  "Pagamento completato",
];

export const PHRASES = [
  "La tua richiesta è stata registrata con successo. È tutto avviato, puoi stare tranquillo. 💸",
  "Ciò che ti spetta arriva sempre. Il tuo saldo è in fase di verifica da parte del sistema di pagamento. ✨",
  "La pazienza fa parte del guadagno. Ogni ora ti avvicina all’obiettivo. 🌱",
  "Tutti i controlli sono stati completati. Stiamo preparando il pagamento per l'accredito sul tuo conto. 🎯",
  "Il tuo pagamento è in elaborazione finale da parte del sistema. Manca davvero poco. ⏳",
  "Chi sa attendere non torna mai a mani vuote. Lo sblocco procede come previsto. 💫",
];

export type DeliverableState = {
  sessionId: string;
  email: string | null;
  purchasedAt: string;
  day: number;
  totalDays: number;
  progress: number;
  released: boolean;
  amount: number | null;
  currency: string;
};
