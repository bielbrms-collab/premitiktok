ALTER TABLE public.email_deliveries
  ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_opened_at timestamp with time zone;