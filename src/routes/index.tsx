import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TikTok Rewards | Inicio" },
      {
        name: "description",
        content: "Inicio del fluxo de recompensas e retiro de saldo TikTok Rewards.",
      },
      { property: "og:title", content: "TikTok Rewards | Inicio" },
      {
        property: "og:description",
        content: "Inicio del fluxo de recompensas e retiro de saldo TikTok Rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/pressel/index.html");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-2xl font-bold">TikTok Rewards</h1>
      <div className="max-w-2xl text-left bg-card p-6 rounded-xl border shadow-sm">
        <p className="font-mono text-xs text-muted-foreground mb-4">Diagnostic Mode: Enabled</p>
        <p className="text-sm whitespace-pre-wrap">
          Configure a variável de ambiente COOUD_SECRET_KEY no meu ambiente de execução para o backend conseguir autenticar as chamadas da Cooud.
        </p>
      </div>
    </div>
  );
}
