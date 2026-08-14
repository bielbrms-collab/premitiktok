CREATE TABLE public.payment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  event_type TEXT,
  product_id TEXT,
  offer TEXT,
  session_id TEXT,
  code TEXT,
  message TEXT,
  amount INTEGER,
  currency TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX payment_events_created_at_idx ON public.payment_events (created_at DESC);
CREATE INDEX payment_events_offer_idx ON public.payment_events (offer, source);