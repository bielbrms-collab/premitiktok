import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PRODUCTS } from "@/lib/cooud-products";

const schema = z.object({
  productId: z.string().min(1).max(100),
  sessionId: z.string().max(200).optional(),
  code: z.string().max(120).optional(),
  message: z.string().max(500).optional(),
});

export const Route = createFileRoute("/api/public/cooud/payment-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("invalid", { status: 400 });

        const product = PRODUCTS[parsed.data.productId];
        if (!product) return new Response("unknown product", { status: 400 });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("payment_events").insert({
            source: "element_error",
            event_type: "payment_failed",
            product_id: parsed.data.productId,
            offer: product.stage,
            session_id: parsed.data.sessionId ?? null,
            code: parsed.data.code ?? null,
            message: parsed.data.message ?? null,
            amount: product.amount,
            currency: product.currency,
          });
        } catch (error) {
          console.error("[Cooud] falha ao registrar recusa", error);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
