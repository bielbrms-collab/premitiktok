import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/up2-fr")({
  head: () => ({
    meta: [
      { title: "Richiesta di rimborso confermata — Up 2.2" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Up2FrPage,
});

function Up2FrPage() {
  return (
    <iframe
      src="/up2-fr/index.html"
      title="Up 2.2"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
