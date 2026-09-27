import { createFileRoute } from "@tanstack/react-router";

// Serve the raw HTML directly so Cooud's scanner finds the script in the page source.
export const Route = createFileRoute("/up2-fr")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const res = await fetch(new URL("/up2-fr/index.html", request.url));
        const html = await res.text();
        return new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
        });
      },
    },
  },
});
