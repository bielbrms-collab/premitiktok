import { createFileRoute } from "@tanstack/react-router";

/** GIF transparente 1x1 usado como pixel de rastreamento de abertura. */
const PIXEL = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
  (c) => c.charCodeAt(0),
);

function pixelResponse() {
  return new Response(PIXEL as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": "image/gif",
      "cache-control": "no-store, no-cache, must-revalidate, private",
      pragma: "no-cache",
    },
  });
}

export const Route = createFileRoute("/api/public/email-open")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = new URL(request.url).searchParams.get("d");
        if (id) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data } = await supabaseAdmin
              .from("email_deliveries")
              .select("open_count")
              .eq("id", id)
              .maybeSingle();
            if (data) {
              await supabaseAdmin
                .from("email_deliveries")
                .update({
                  open_count: ((data as { open_count: number | null }).open_count ?? 0) + 1,
                  last_opened_at: new Date().toISOString(),
                } as never)
                .eq("id", id);
            }
          } catch (error) {
            console.error("[email open] falha ao registrar abertura", error);
          }
        }
        return pixelResponse();
      },
    },
  },
});
