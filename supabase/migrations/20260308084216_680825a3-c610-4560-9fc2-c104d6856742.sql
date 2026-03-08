
-- Fix the security definer view by making it use invoker security
DROP VIEW IF EXISTS public.chapters_metadata;
CREATE VIEW public.chapters_metadata
WITH (security_invoker = true)
AS SELECT id, novel_id, title, chapter_number, is_premium, coin_price, status, created_at, updated_at, scheduled_at
FROM public.chapters;
GRANT SELECT ON public.chapters_metadata TO anon, authenticated;
