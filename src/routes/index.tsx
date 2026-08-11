import { createFileRoute, redirect } from "@tanstack/react-router";

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
  beforeLoad: () => {
    throw redirect({ href: "/pressel/index.html" });
  },
  component: Index,
});

function Index() {
  return null;
}
