/** Catálogo das ofertas vendidas via Cooud (dados puros, sem segredos). */
export type ProductConfig = {
  readonly name: string;
  /** Rótulo enviado à gateway da Cooud. */
  readonly cooudLabel: string;
  /** Etapa do funil, usada nos relatórios de pagamento. */
  readonly stage: "front" | "back_redirect" | "upsell";
  readonly amount: number;
  readonly currency: string;
  readonly priceId?: string;
};

export const PRODUCTS: Record<string, ProductConfig> = {
  "01KZ7W13DD2MVBGG66NPG9EA9T": {
    name: "How to learn French",
    cooudLabel: "How to learn French",
    stage: "front",
    amount: 2790,
    currency: "EUR",
  },
  "43ca5d35-3492-4567-913d-dc2843ba6931": {
    name: "Costi di sblocco ridotti",
    cooudLabel: "How to learn Spanish",
    stage: "back_redirect",
    amount: 1950,
    currency: "EUR",
  },
  "65009b71-7660-44ef-ba87-24f29c7599a4": {
    name: "Nuovo tentativo di sblocco",
    cooudLabel: "How to learn Germany",
    stage: "upsell",
    amount: 1690,
    currency: "EUR",
  },
};
