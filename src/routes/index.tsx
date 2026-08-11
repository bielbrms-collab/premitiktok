import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "fs/promises";

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: async () => {
        const html = await readFile("./public/index.html", "utf-8");
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
