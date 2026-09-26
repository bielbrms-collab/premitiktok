import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/up1-fr")({
  head: () => ({
    meta: [
      { title: "Transazione confermata — Up 1.2" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Up1FrPage,
});

function Up1FrPage() {
  return (
    <iframe
      src="/up1-fr/index.html"
      title="Up 1.2"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
