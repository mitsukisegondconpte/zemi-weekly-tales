
DROP POLICY IF EXISTS "Authors upload own folder" ON storage.objects;
CREATE POLICY "Authors upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chapter-images'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND public.is_author(auth.uid())
);

DROP POLICY IF EXISTS "Authors update own folder" ON storage.objects;
CREATE POLICY "Authors update own folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'chapter-images'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND public.is_author(auth.uid())
);

DROP POLICY IF EXISTS "Authors delete own folder" ON storage.objects;
CREATE POLICY "Authors delete own folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chapter-images'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND public.is_author(auth.uid())
);

DROP POLICY IF EXISTS "Public read chapter-images" ON storage.objects;
CREATE POLICY "Public read chapter-images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chapter-images');

DROP POLICY IF EXISTS "Admins manage chapter-images" ON storage.objects;
CREATE POLICY "Admins manage chapter-images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'chapter-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'chapter-images' AND public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads comment_likes" ON public.comment_likes;
CREATE POLICY "Anyone reads comment_likes" ON public.comment_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users like comments" ON public.comment_likes;
CREATE POLICY "Users like comments" ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users unlike own" ON public.comment_likes;
CREATE POLICY "Users unlike own" ON public.comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.chapter_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid NOT NULL,
  novel_id uuid NOT NULL,
  scroll_pct integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own progress" ON public.chapter_progress;
CREATE POLICY "Users read own progress" ON public.chapter_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own progress" ON public.chapter_progress;
CREATE POLICY "Users insert own progress" ON public.chapter_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own progress" ON public.chapter_progress;
CREATE POLICY "Users update own progress" ON public.chapter_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.reader_settings (
  user_id uuid PRIMARY KEY,
  font_size integer NOT NULL DEFAULT 18,
  theme text NOT NULL DEFAULT 'light',
  line_height numeric NOT NULL DEFAULT 1.7,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reader_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own reader settings" ON public.reader_settings;
CREATE POLICY "Users manage own reader settings" ON public.reader_settings FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.comment_likes REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.get_author_stats(_author_id uuid)
RETURNS TABLE(
  total_novels bigint,
  total_chapters bigint,
  total_published bigint,
  total_pending bigint,
  total_comments bigint,
  total_unlocks bigint,
  total_coins_earned bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM novels WHERE author_id = _author_id),
    (SELECT count(*) FROM chapters WHERE author_id = _author_id),
    (SELECT count(*) FROM chapters WHERE author_id = _author_id AND status = 'published'),
    (SELECT count(*) FROM chapters WHERE author_id = _author_id AND moderation_status = 'pending'),
    (SELECT count(*) FROM comments c JOIN chapters ch ON ch.id = c.chapter_id WHERE ch.author_id = _author_id),
    (SELECT count(*) FROM unlocked_chapters uc JOIN chapters ch ON ch.id = uc.chapter_id WHERE ch.author_id = _author_id),
    COALESCE((SELECT sum(uc.coins_spent) FROM unlocked_chapters uc JOIN chapters ch ON ch.id = uc.chapter_id WHERE ch.author_id = _author_id), 0);
$$;

CREATE OR REPLACE FUNCTION public.get_admin_overview()
RETURNS TABLE(
  total_users bigint,
  new_users_7d bigint,
  total_novels bigint,
  pending_applications bigint,
  pending_chapters bigint,
  total_comments bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM profiles),
    (SELECT count(*) FROM profiles WHERE created_at > now() - interval '7 days'),
    (SELECT count(*) FROM novels),
    (SELECT count(*) FROM author_applications WHERE status = 'pending'),
    (SELECT count(*) FROM chapters WHERE moderation_status = 'pending'),
    (SELECT count(*) FROM comments);
$$;

CREATE OR REPLACE FUNCTION public.get_continue_reading(_user_id uuid, _limit int DEFAULT 6)
RETURNS TABLE(
  novel_id uuid,
  chapter_id uuid,
  scroll_pct integer,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT ON (cp.novel_id) cp.novel_id, cp.chapter_id, cp.scroll_pct, cp.updated_at
  FROM chapter_progress cp
  WHERE cp.user_id = _user_id
  ORDER BY cp.novel_id, cp.updated_at DESC
  LIMIT _limit;
$$;
