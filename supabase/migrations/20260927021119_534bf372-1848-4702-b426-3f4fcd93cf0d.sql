CREATE TABLE public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  reason text NOT NULL,
  details text,
  session_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.refund_requests TO service_role;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access to refund requests" ON public.refund_requests FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE INDEX refund_requests_created_at_idx ON public.refund_requests (created_at DESC);