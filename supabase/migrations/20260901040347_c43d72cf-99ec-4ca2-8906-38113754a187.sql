CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_id text,
  subject text NOT NULL DEFAULT 'Félicitations ! Votre achat a été confirmé 🎉',
  from_name text NOT NULL DEFAULT 'Support',
  from_email text NOT NULL DEFAULT 'support@suportetikt0k.shop',
  heading text NOT NULL DEFAULT 'Félicitations !',
  intro text NOT NULL DEFAULT 'Votre paiement a bien été approuvé.',
  body_text text NOT NULL DEFAULT '',
  button_label text NOT NULL DEFAULT 'ACCÉDER À MON PRODUIT',
  deliverable_url text NOT NULL DEFAULT 'https://tiktok-francevendpay.lovable.app/entregavel',
  fallback_note text NOT NULL DEFAULT 'Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :',
  signature text NOT NULL DEFAULT 'L''équipe Support',
  accent_color text NOT NULL DEFAULT '#fe2c55',
  active boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id text NOT NULL UNIQUE,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  product_id text,
  recipient_email text,
  recipient_name text,
  subject text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_deliveries_created_at_idx ON public.email_deliveries (created_at DESC);

GRANT ALL ON public.email_templates TO service_role;
GRANT ALL ON public.email_deliveries TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to email templates" ON public.email_templates AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No direct client access to email deliveries" ON public.email_deliveries AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER email_deliveries_updated_at BEFORE UPDATE ON public.email_deliveries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.email_templates (name, product_id, body_text, active, is_default)
VALUES ('Modèle par défaut', NULL, 'Merci pour votre confiance. Votre accès est disponible immédiatement en cliquant sur le bouton ci-dessous.', true, true);