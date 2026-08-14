export const TOTAL_DAYS = 12;

export const STEP_TITLES = [
  "Pedido registrado",
  "Verificación iniciada",
  "Validación de identidad",
  "Revisión del saldo",
  "Aprobación de seguridad",
  "Compensación bancaria",
  "Reserva de fondos",
  "Antifraude aprobado",
  "En cola de envío",
  "Depósito autorizado",
  "Confirmación final",
  "Contenido liberado 🎉",
];

export const PHRASES = [
  "Tu solicitud fue registrada con éxito. Todo ya está en marcha. Respira, lo bueno ya empezó. 💸",
  "Todo lo que es tuyo, te encuentra. Tu saldo está siendo verificado por el sistema de pagos. ✨",
  "La paciencia también es una forma de ganar. Cada hora que pasa estás más cerca. 🌱",
  "Nadie que espera con fe se queda con las manos vacías. La liberación avanza según lo previsto. 💫",
  "El universo no falla en las cuentas: lo que trabajaste, vuelve. Pasaste la primera validación de seguridad. 🔐",
  "Confía en el proceso, incluso cuando no lo ves moverse. Estás en la fase de compensación bancaria. 🚀",
  "Las mejores recompensas llegan a quienes no se rinden a mitad de camino. Tu saldo ya está reservado a tu nombre. 🏆",
  "Hoy estás más cerca que ayer. La verificación antifraude fue aprobada correctamente. 🛡️",
  "Lo que es tuyo no se pierde, solo toma el camino correcto. Entraste en la cola final de envío. 📲",
  "Quien siembra constancia, cosecha resultados. Tu liberación fue autorizada. 🌟",
  "Falta muy poco. El sistema está confirmando los últimos datos. ⏳",
  "¡Llegó el día! Tu acceso fue liberado. Gracias por confiar. 🎉",
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
