import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TikTok Récompenses | Accueil" },
      {
        name: "description",
        content: "Point de départ du parcours de récompenses et de retrait de solde TikTok.",
      },
      { property: "og:title", content: "TikTok Récompenses | Accueil" },
      {
        property: "og:description",
        content: "Point de départ du parcours de récompenses et de retrait de solde TikTok.",
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
