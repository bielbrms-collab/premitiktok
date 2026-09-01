import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  listEmailTemplates,
  saveEmailTemplate,
  deleteEmailTemplate,
  sendTestEmail,
  listEmailDeliveries,
  resendDeliveryEmail,
} from "@/lib/emails.functions";
import {
  renderEmailHtml,
  renderEmailSubject,
  type EmailDelivery,
  type EmailTemplate,
} from "@/lib/email-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/envio-emails")({
  head: () => ({
    meta: [
      { title: "Envio de E-mails | Painel de entrega automática" },
      {
        name: "description",
        content:
          "Crie, edite e teste os e-mails de entrega automática enviados após a aprovação do pagamento.",
      },
      { property: "og:title", content: "Envio de E-mails | Painel de entrega automática" },
      {
        property: "og:description",
        content: "Modelos, preview em tempo real, envio de teste e histórico de entregas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EnvioEmailsPage,
});

type Draft = Omit<EmailTemplate, "created_at" | "updated_at">;

const EMPTY: Draft = {
  id: "",
  name: "Nouveau modèle",
  product_id: null,
  subject: "Informations d’accès à votre espace",
  from_name: "Équipe Support",
  from_email: "support@notify.suportetikt0k.shop",
  reply_to: "support@notify.suportetikt0k.shop",
  heading: "Bienvenue dans votre espace",
  intro: "Bonjour {{nom}}, votre accès personnel est disponible.",
  body_text:
    "Vous pouvez maintenant consulter les informations et les contenus associés à votre inscription depuis la page dédiée.\n\nConservez cet e-mail afin de retrouver facilement votre accès.\n\nSi cet e-mail n'apparaît pas dans votre boîte de réception, vérifiez également le dossier courriers indésirables.",
  button_label: "Accéder à mon espace",
  deliverable_url: "https://tiktok-francevendpay.lovable.app/entregavel",
  fallback_note: "",
  signature: "Équipe Support\nsupport@notify.suportetikt0k.shop",
  accent_color: "#fe2c55",
  active: false,
  is_default: false,
};

function EnvioEmailsPage() {
  const fetchTemplates = useServerFn(listEmailTemplates);
  const saveTpl = useServerFn(saveEmailTemplate);
  const removeTpl = useServerFn(deleteEmailTemplate);
  const sendTest = useServerFn(sendTestEmail);
  const fetchDeliveries = useServerFn(listEmailDeliveries);
  const resend = useServerFn(resendDeliveryEmail);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [deliveries, setDeliveries] = useState<EmailDelivery[]>([]);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [tpls, logs] = await Promise.all([fetchTemplates(), fetchDeliveries()]);
    setTemplates(tpls);
    setDeliveries(logs);
    return tpls;
  };

  useEffect(() => {
    reload()
      .then((tpls) => {
        const first = tpls[0];
        if (first) setDraft(first);
      })
      .catch((error: unknown) => toast.error(String(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewHtml = useMemo(
    () =>
      renderEmailHtml(draft as EmailTemplate, {
        name: "Marie",
        email: "marie@exemple.fr",
        product: draft.name,
        saleId: "VP-000123",
      }),
    [draft],
  );

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const payload = () => {
    const { id, ...rest } = draft;
    return { ...rest, ...(id ? { id } : {}) };
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const saved = await saveTpl({ data: payload() });
      setDraft(saved);
      await reload();
      toast.success("Modelo salvo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return toast.error("Informe um e-mail para o teste.");
    setBusy(true);
    try {
      const result = await sendTest({ data: { to: testEmail, template: payload() } });
      if (result.sent) toast.success("E-mail de teste enviado.");
      else toast.error(result.error ?? "Falha no envio de teste.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no envio de teste.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <header className="mx-auto mb-6 max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Envio de E-mails</h1>
        <p className="text-sm text-muted-foreground">
          Entrega automática do infoproduto após a aprovação do pagamento na Vendepay.
        </p>
      </header>

      <div className="mx-auto max-w-7xl">
        <Tabs defaultValue="editor">
          <TabsList>
            <TabsTrigger value="editor">Modelos & preview</TabsTrigger>
            <TabsTrigger value="historico">Histórico ({deliveries.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {templates.map((tpl) => (
                <Button
                  key={tpl.id}
                  size="sm"
                  variant={draft.id === tpl.id ? "default" : "outline"}
                  onClick={() => setDraft(tpl)}
                >
                  {tpl.name}
                  {tpl.active ? " ●" : ""}
                </Button>
              ))}
              <Button size="sm" variant="secondary" onClick={() => setDraft({ ...EMPTY })}>
                + Novo modelo
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome do modelo">
                    <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
                  </Field>
                  <Field label="ID do produto (opcional)">
                    <Input
                      value={draft.product_id ?? ""}
                      placeholder="deixe vazio p/ modelo padrão"
                      onChange={(e) => set("product_id", e.target.value || null)}
                    />
                  </Field>
                </div>

                <Field label="Assunto">
                  <Input value={draft.subject} onChange={(e) => set("subject", e.target.value)} />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome do remetente">
                    <Input
                      value={draft.from_name}
                      onChange={(e) => set("from_name", e.target.value)}
                    />
                  </Field>
                  <Field label="E-mail do remetente">
                    <Input
                      value={draft.from_email}
                      onChange={(e) => set("from_email", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Responder para (reply-to)">
                  <Input
                    value={draft.reply_to ?? ""}
                    placeholder="support@notify.suportetikt0k.shop"
                    onChange={(e) => set("reply_to", e.target.value || null)}
                  />
                </Field>
                <p className="-mt-1 text-xs text-muted-foreground">
                  Use sempre endereços @notify.suportetikt0k.shop — é o único domínio autenticado
                  (SPF/DKIM/DMARC). Outros domínios são substituídos automaticamente no envio.
                </p>

                <Field label="Título">
                  <Input value={draft.heading} onChange={(e) => set("heading", e.target.value)} />
                </Field>
                <Field label="Frase de destaque">
                  <Input value={draft.intro} onChange={(e) => set("intro", e.target.value)} />
                </Field>
                <Field label="Texto do e-mail (use {{nom}}, {{produit}}, {{commande}})">
                  <Textarea
                    rows={5}
                    value={draft.body_text}
                    onChange={(e) => set("body_text", e.target.value)}
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Texto do botão">
                    <Input
                      value={draft.button_label}
                      onChange={(e) => set("button_label", e.target.value)}
                    />
                  </Field>
                  <Field label="Cor de destaque">
                    <Input
                      type="color"
                      value={draft.accent_color}
                      onChange={(e) => set("accent_color", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Link do entregável">
                  <Input
                    value={draft.deliverable_url}
                    onChange={(e) => set("deliverable_url", e.target.value)}
                  />
                </Field>
                <Field label="Texto do link alternativo">
                  <Input
                    value={draft.fallback_note}
                    onChange={(e) => set("fallback_note", e.target.value)}
                  />
                </Field>
                <Field label="Assinatura">
                  <Textarea
                    rows={2}
                    value={draft.signature}
                    onChange={(e) => set("signature", e.target.value)}
                  />
                </Field>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={draft.active} onCheckedChange={(v) => set("active", v)} />
                    Ativo
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={draft.is_default}
                      onCheckedChange={(v) => set("is_default", v)}
                    />
                    Modelo padrão
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                  <Button onClick={handleSave} disabled={busy}>
                    Salvar modelo
                  </Button>
                  {draft.id ? (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        await removeTpl({ data: { id: draft.id } });
                        setDraft({ ...EMPTY });
                        await reload();
                        toast.success("Modelo removido.");
                      }}
                    >
                      Excluir
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-end gap-2 border-t pt-4">
                  <Field label="Enviar teste para">
                    <Input
                      value={testEmail}
                      placeholder="voce@exemplo.com"
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </Field>
                  <Button variant="secondary" onClick={handleTest} disabled={busy}>
                    Enviar teste
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {renderEmailSubject(draft as EmailTemplate, { name: "Marie" })}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {draft.from_name} &lt;{draft.from_email}&gt;
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={device === "desktop" ? "default" : "outline"}
                      onClick={() => setDevice("desktop")}
                    >
                      Computador
                    </Button>
                    <Button
                      size="sm"
                      variant={device === "mobile" ? "default" : "outline"}
                      onClick={() => setDevice("mobile")}
                    >
                      Celular
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center overflow-hidden rounded-lg border bg-background">
                  <iframe
                    title="Preview do e-mail"
                    srcDoc={previewHtml}
                    className="h-[720px] border-0 bg-white transition-all"
                    style={{ width: device === "mobile" ? 390 : "100%" }}
                  />
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Comprador</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Venda</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Erro</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="p-3 whitespace-nowrap">
                        {new Date(d.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-3">{d.recipient_email ?? "—"}</td>
                      <td className="p-3">{d.product_id ?? "—"}</td>
                      <td className="p-3 font-mono text-xs">{d.sale_id}</td>
                      <td className="p-3">
                        <span
                          className={
                            d.status === "sent"
                              ? "font-semibold text-emerald-600"
                              : "font-semibold text-destructive"
                          }
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate p-3 text-xs text-muted-foreground">
                        {d.error_message ?? ""}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              const r = await resend({ data: { saleId: d.sale_id } });
                              r.sent
                                ? toast.success("Reenviado.")
                                : toast.error(r.error ?? "Falha no reenvio.");
                              await reload();
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Reenviar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {deliveries.length === 0 ? (
                    <tr>
                      <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                        Nenhum envio registrado ainda.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
