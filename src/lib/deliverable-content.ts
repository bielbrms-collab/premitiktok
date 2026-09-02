export const TOTAL_DAYS = 12;

export const STEP_TITLES = [
  "Richiesta registrata",
  "Verifica avviata",
  "Convalida d’identità",
  "Controllo del saldo",
  "Convalida di sicurezza",
  "Compensazione bancaria",
  "Riserva dei fondi",
  "Controllo antifrode superato",
  "Coda di invio",
  "Bonifico autorizzato",
  "Conferma finale",
  "Accesso sbloccato 🎉",
];

export const PHRASES = [
  "La tua richiesta è stata registrata con successo. È tutto avviato, puoi stare tranquillo. 💸",
  "Ciò che ti spetta arriva sempre. Il tuo saldo è in fase di verifica da parte del sistema di pagamento. ✨",
  "La pazienza fa parte del guadagno. Ogni ora ti avvicina all’obiettivo. 🌱",
  "Chi sa attendere non torna mai a mani vuote. Lo sblocco procede come previsto. 💫",
  "I conti tornano sempre: la prima convalida di sicurezza è stata superata. 🔐",
  "Fidati del processo, anche quando sembra che nulla si muova. Sei in fase di compensazione bancaria. 🚀",
  "I risultati migliori arrivano a chi non molla lungo il percorso. Il tuo saldo è già riservato a tuo nome. 🏆",
  "Sei più vicino di ieri. Il controllo antifrode è appena stato superato. 🛡️",
  "Ciò che ti appartiene non si perde, prende solo la strada giusta. Sei nella coda finale di invio. 📲",
  "La costanza paga sempre. Il tuo sblocco è stato autorizzato. 🌟",
  "Manca pochissimo. Il sistema sta confermando gli ultimi dati. ⏳",
  "È arrivato il grande giorno! Il tuo accesso è sbloccato. Grazie per la fiducia. 🎉",
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
