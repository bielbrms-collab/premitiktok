CREATE TABLE public.deliverable_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  email TEXT,
  product_id TEXT,
  amount INTEGER,
  currency TEXT NOT NULL DEFAULT 'EUR',
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.deliverable_purchases TO service_role;

ALTER TABLE public.deliverable_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to deliverable purchases"
ON public.deliverable_purchases
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);