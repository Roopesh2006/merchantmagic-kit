ALTER TABLE public.shop
  ADD COLUMN IF NOT EXISTS banner_url_1 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_url_2 text;