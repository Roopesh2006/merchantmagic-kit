
-- Revoke broad select and grant only safe columns
REVOKE SELECT ON public.shop FROM anon, authenticated;
GRANT SELECT (id, name, slug, shop_phone_number, created_at, updated_at) ON public.shop TO anon, authenticated;
