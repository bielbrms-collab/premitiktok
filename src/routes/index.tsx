import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "fs/promises";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  loader: async () => {
    const html = await readFile("./public/index.html", "utf-8");
    return { html };
  },
  component: Index,
});

function Index() {
  const { html } = Route.useLoaderData();

  useEffect(() => {
    // Substitui o documento atual pelo HTML estático da pressel,
    // garantindo que / exiba a landing page sem aninhar <html> dentro do app.
    if (document.documentElement && html) {
      document.open();
      document.write(html);
      document.close();
    }
  }, [html]);

  return null;
}
