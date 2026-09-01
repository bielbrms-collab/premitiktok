DROP POLICY "No direct client access to email templates" ON public.email_templates;
DROP POLICY "No direct client access to email deliveries" ON public.email_deliveries;
CREATE POLICY "No direct client access to email templates" ON public.email_templates FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No direct client access to email deliveries" ON public.email_deliveries FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);