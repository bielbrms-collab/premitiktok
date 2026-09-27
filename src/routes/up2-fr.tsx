import { createFileRoute } from "@tanstack/react-router";
import html from "../../public/up2-fr/index.html?raw";

// Serve the raw HTML directly so Cooud's scanner finds the script in the page source.
export const Route = createFileRoute("/up2-fr")({
  server: {
    handlers: {
      GET: async () =>
        new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
        }),
    },
  },
});
