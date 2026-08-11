import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "fs/promises";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  loader: async () => {
    const html = await readFile("./public/index.html", "utf-8");
    return { html };
  },
  component: Index,
});

function Index() {
  const { html } = Route.useLoaderData();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Executa scripts inline e externos inseridos via innerHTML,
    // pois o navegador não os executa automaticamente.
    const scripts = ref.current.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [html]);

  return (
    <div
      ref={ref}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ width: "100%", minHeight: "100vh" }}
    />
  );
}
