export const TOTAL_DAYS = 12;

export const STEP_TITLES = [
  "Demande enregistrée",
  "Vérification lancée",
  "Validation d’identité",
  "Contrôle du solde",
  "Validation de sécurité",
  "Compensation bancaire",
  "Réservation des fonds",
  "Contrôle anti-fraude validé",
  "File d’envoi",
  "Virement autorisé",
  "Confirmation finale",
  "Accès débloqué 🎉",
];

export const PHRASES = [
  "Votre demande a bien été enregistrée. Tout est lancé, vous pouvez souffler. 💸",
  "Ce qui vous revient finit toujours par arriver. Votre solde est en cours de vérification par le système de paiement. ✨",
  "La patience fait aussi partie du gain. Chaque heure vous rapproche du but. 🌱",
  "Personne qui patiente ne repart les mains vides. Le déblocage avance comme prévu. 💫",
  "Les comptes finissent toujours par tomber juste : la première validation de sécurité est passée. 🔐",
  "Faites confiance au processus, même quand rien ne semble bouger. Vous êtes en phase de compensation bancaire. 🚀",
  "Les meilleures récompenses vont à ceux qui ne lâchent pas en route. Votre solde est déjà réservé à votre nom. 🏆",
  "Vous êtes plus près qu’hier. Le contrôle anti-fraude vient d’être validé. 🛡️",
  "Ce qui vous appartient ne se perd pas, il prend juste le bon chemin. Vous êtes dans la file finale d’envoi. 📲",
  "La constance paie toujours. Votre déblocage a été autorisé. 🌟",
  "Il ne reste presque plus rien. Le système confirme les dernières données. ⏳",
  "Le grand jour est arrivé ! Votre accès est débloqué. Merci de votre confiance. 🎉",
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
