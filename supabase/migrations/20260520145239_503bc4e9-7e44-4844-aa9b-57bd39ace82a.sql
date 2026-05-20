
DROP VIEW IF EXISTS public.shop_public;
CREATE VIEW public.shop_public WITH (security_invoker = true) AS
  SELECT id, name, slug, shop_phone_number, created_at, updated_at FROM public.shop;
GRANT SELECT ON public.shop_public TO anon, authenticated;

-- Allow the view's underlying SELECT for anon (limited to non-sensitive cols via the view).
-- Since security_invoker is on, the underlying table policy must allow SELECT.
-- We expose only the public columns through the view but RLS is still evaluated on the base table.
CREATE POLICY "Public read shop limited" ON public.shop FOR SELECT USING (true);
-- Note: admin_password_hash is never selected through the view; server functions use service role.

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
