import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/up3-fr")({
  head: () => ({
    meta: [
      { title: "Offerta esclusiva — Up 3.2" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Up3FrPage,
});

function Up3FrPage() {
  return (
    <iframe
      src="/up3-fr/index.html"
      title="Up 3.2"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
