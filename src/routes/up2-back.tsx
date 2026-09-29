import { createFileRoute } from "@tanstack/react-router";
import html from "../../public/up2-back/index.html?raw";

// Serve the raw HTML directly so Cooud's scanner finds the script in the page source.
export const Route = createFileRoute("/up2-back")({
  server: {
    handlers: {
      GET: async () =>
        new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
        }),
    },
  },
});
