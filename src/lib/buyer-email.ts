/**
 * Recupera o e-mail informado no front (pressel) para pré-preencher o
 * checkout embutido nas páginas seguintes do funil (up1, back-redirect).
 */
export function getStoredBuyerEmail(): string {
  if (typeof window === "undefined") return "";

  // 1) Dados do formulário da pressel (window.__formData)
  const formData = (window as typeof window & { __formData?: { correo?: string; email?: string } })
    .__formData;
  const fromForm = formData?.correo ?? formData?.email;
  if (fromForm && fromForm.includes("@")) return fromForm.trim();

  // 2) localStorage: userPixData { correo }
  try {
    const raw = window.localStorage.getItem("userPixData");
    if (raw) {
      const parsed = JSON.parse(raw) as { correo?: string; email?: string };
      const value = parsed?.correo ?? parsed?.email;
      if (value && value.includes("@")) return value.trim();
    }
  } catch {
    /* ignora */
  }

  // 3) Chaves soltas usadas em outros pontos do funil
  for (const key of ["checkout_email", "buyer_email", "customer_email"]) {
    const value = window.localStorage.getItem(key);
    if (value && value.includes("@")) return value.trim();
  }

  return "";
}
