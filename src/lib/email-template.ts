/** Modelo de e-mail de entrega (dados puros, usados no preview e no envio real). */
export type EmailTemplate = {
  id: string;
  name: string;
  product_id: string | null;
  subject: string;
  from_name: string;
  from_email: string;
  /** Endereço usado quando o cliente responde ao e-mail. */
  reply_to?: string | null;
  heading: string;
  intro: string;
  body_text: string;
  button_label: string;
  deliverable_url: string;
  fallback_note: string;
  signature: string;
  accent_color: string;
  active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type EmailDelivery = {
  id: string;
  sale_id: string;
  template_id: string | null;
  product_id: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  subject: string | null;
  status: string;
  error_message: string | null;
  attempts: number;
  sent_at: string | null;
  created_at: string;
};

export type EmailVars = {
  name?: string | null;
  email?: string | null;
  product?: string | null;
  saleId?: string | null;
};

export const EMAIL_PLACEHOLDERS = ["{{nom}}", "{{email}}", "{{produit}}", "{{commande}}"];

export function applyVars(text: string, vars: EmailVars): string {
  return text
    .replaceAll("{{nom}}", vars.name?.trim() || "cher client")
    .replaceAll("{{email}}", vars.email ?? "")
    .replaceAll("{{produit}}", vars.product ?? "")
    .replaceAll("{{commande}}", vars.saleId ?? "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(text: string, vars: EmailVars): string {
  return applyVars(text, vars)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#3f3f46;">${escapeHtml(
          block,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

export function renderEmailSubject(tpl: EmailTemplate, vars: EmailVars = {}): string {
  return applyVars(tpl.subject, vars);
}

export function renderEmailText(tpl: EmailTemplate, vars: EmailVars = {}): string {
  return [
    applyVars(tpl.heading, vars),
    "",
    applyVars(tpl.intro, vars),
    "",
    applyVars(tpl.body_text, vars),
    "",
    `${applyVars(tpl.button_label, vars)} : ${tpl.deliverable_url}`,
    "",
    applyVars(tpl.fallback_note, vars),
    tpl.deliverable_url,
    "",
    applyVars(tpl.signature, vars),
    "",
    TRANSACTIONAL_NOTICE,
  ]
    .join("\n")
    .trim();
}

/** HTML compatível com clients de e-mail (tabelas, estilos inline, responsivo). */
export function renderEmailHtml(tpl: EmailTemplate, vars: EmailVars = {}): string {
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(tpl.accent_color) ? tpl.accent_color : "#fe2c55";
  const url = escapeHtml(tpl.deliverable_url);

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(renderEmailSubject(tpl, vars))}</title>
<style>
  @media only screen and (max-width:600px){
    .wrap{padding:16px !important;}
    .card{border-radius:14px !important;}
    .pad{padding:24px 20px !important;}
    .btn a{display:block !important;text-align:center !important;}
    h1{font-size:24px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    applyVars(tpl.intro, vars),
  )}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
  <tr><td align="center" class="wrap" style="padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
      <tr><td style="height:6px;background:${accent};"></td></tr>
      <tr><td class="pad" style="padding:36px 40px 8px;">
        <h1 style="margin:0 0 12px;font-size:28px;line-height:36px;color:#18181b;font-weight:800;">${escapeHtml(
          applyVars(tpl.heading, vars),
        )}</h1>
        <p style="margin:0 0 20px;font-size:17px;line-height:27px;color:#18181b;font-weight:600;">${escapeHtml(
          applyVars(tpl.intro, vars),
        )}</p>
        ${paragraphs(tpl.body_text, vars)}
      </td></tr>
      <tr><td class="pad" align="center" style="padding:8px 40px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" class="btn" style="width:100%;">
          <tr><td align="center" bgcolor="${accent}" style="border-radius:999px;">
            <a href="${url}" style="display:inline-block;padding:16px 34px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;letter-spacing:0.4px;">${escapeHtml(
              applyVars(tpl.button_label, vars),
            )}</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td class="pad" style="padding:0 40px 32px;">
        <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#71717a;">${escapeHtml(
          applyVars(tpl.fallback_note, vars),
        )}</p>
        <p style="margin:0;font-size:13px;line-height:20px;word-break:break-all;"><a href="${url}" style="color:${accent};text-decoration:underline;">${url}</a></p>
      </td></tr>
      <tr><td style="padding:22px 40px;background:#fafafa;border-top:1px solid #ececee;">
        <p style="margin:0;font-size:14px;line-height:22px;color:#52525b;">${escapeHtml(
          applyVars(tpl.signature, vars),
        ).replace(/\n/g, "<br />")}</p>
      </td></tr>
    </table>
    <p style="margin:18px 0 0;font-size:12px;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(
      tpl.from_email,
    )}</p>
  </td></tr>
</table>
</body>
</html>`;
}
