import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TikTok Ricompense | Home" },
      {
        name: "description",
        content: "Punto di partenza del percorso di ricompense e prelievo del saldo TikTok.",
      },
      { property: "og:title", content: "TikTok Ricompense | Home" },
      {
        property: "og:description",
        content: "Punto di partenza del percorso di ricompense e prelievo del saldo TikTok.",
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
