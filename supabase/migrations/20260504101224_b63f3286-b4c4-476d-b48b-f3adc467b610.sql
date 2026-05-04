
-- ============================================================
-- 1. ADMIN LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  target_label text,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all logs"
  ON public.admin_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert logs"
  ON public.admin_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs (action);

-- Helper RPC to write a log entry (callable from client by admins only)
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _target_type text,
  _target_id uuid DEFAULT NULL,
  _target_label text DEFAULT NULL,
  _reason text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, target_label, reason, metadata)
  VALUES (auth.uid(), _action, _target_type, _target_id, _target_label, _reason, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- Auto-log moderation decisions and application reviews
CREATE OR REPLACE FUNCTION public.log_chapter_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title text;
BEGIN
  SELECT title INTO _title FROM public.chapters WHERE id = NEW.chapter_id;
  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, target_label, reason)
  VALUES (NEW.admin_id,
          CASE WHEN NEW.status = 'approved' THEN 'chapter_approved' ELSE 'chapter_rejected' END,
          'chapter', NEW.chapter_id, _title, NEW.reason);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_chapter_moderation ON public.chapter_moderation;
CREATE TRIGGER trg_log_chapter_moderation
  AFTER INSERT ON public.chapter_moderation
  FOR EACH ROW EXECUTE FUNCTION public.log_chapter_moderation();

CREATE OR REPLACE FUNCTION public.log_application_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected') THEN
    INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, target_label, reason)
    VALUES (COALESCE(NEW.reviewed_by, auth.uid()),
            CASE WHEN NEW.status = 'accepted' THEN 'application_accepted' ELSE 'application_rejected' END,
            'author_application', NEW.id, NEW.user_id::text, NEW.admin_notes);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_application_review ON public.author_applications;
CREATE TRIGGER trg_log_application_review
  AFTER UPDATE ON public.author_applications
  FOR EACH ROW EXECUTE FUNCTION public.log_application_review();

-- ============================================================
-- 2. ATTACH NOTIFICATION TRIGGERS (functions exist but not attached)
-- ============================================================
DROP TRIGGER IF EXISTS trg_notify_application_decision ON public.author_applications;
CREATE TRIGGER trg_notify_application_decision
  AFTER UPDATE ON public.author_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_decision();

DROP TRIGGER IF EXISTS trg_notify_chapter_moderation ON public.chapter_moderation;
CREATE TRIGGER trg_notify_chapter_moderation
  AFTER INSERT ON public.chapter_moderation
  FOR EACH ROW EXECUTE FUNCTION public.notify_chapter_moderation();

DROP TRIGGER IF EXISTS trg_notify_new_comment ON public.comments;
CREATE TRIGGER trg_notify_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_comment();

DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
CREATE TRIGGER trg_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trg_enforce_chapter_moderation ON public.chapters;
CREATE TRIGGER trg_enforce_chapter_moderation
  BEFORE INSERT OR UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.enforce_chapter_moderation();

DROP TRIGGER IF EXISTS trg_protect_coins ON public.profiles;
CREATE TRIGGER trg_protect_coins
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_coins_column();

DROP TRIGGER IF EXISTS trg_sync_novel_reactions ON public.novel_reactions;
CREATE TRIGGER trg_sync_novel_reactions
  AFTER INSERT OR DELETE ON public.novel_reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_novel_reactions();

DROP TRIGGER IF EXISTS trg_chapters_updated_at ON public.chapters;
CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_novels_updated_at ON public.novels;
CREATE TRIGGER trg_novels_updated_at
  BEFORE UPDATE ON public.novels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. ANTI-DOUBLON: unique constraint per author/novel/title
-- ============================================================
-- Allow same chapter title across novels but not duplicated within a novel
CREATE UNIQUE INDEX IF NOT EXISTS uniq_chapters_per_novel_title
  ON public.chapters (novel_id, lower(trim(title)));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_novels_per_author_title
  ON public.novels (author_id, lower(trim(title)))
  WHERE author_id IS NOT NULL;

-- ============================================================
-- 4. SUBMIT CHAPTER FOR REVIEW (draft -> pending)
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_chapter_for_review(_chapter_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ch record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _ch FROM public.chapters WHERE id = _chapter_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Chapter not found'; END IF;
  IF _ch.author_id <> auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF length(trim(coalesce(_ch.content,''))) < 100 THEN
    RAISE EXCEPTION 'Chapter content too short to submit';
  END IF;
  IF _ch.moderation_status = 'pending' THEN
    RAISE EXCEPTION 'Chapter already pending review';
  END IF;
  IF _ch.moderation_status = 'approved' THEN
    RAISE EXCEPTION 'Chapter already approved';
  END IF;
  -- Bypass enforce_chapter_moderation (it preserves OLD status); use direct update via SECURITY DEFINER
  UPDATE public.chapters
    SET moderation_status = 'pending',
        rejection_reason = NULL,
        updated_at = now()
    WHERE id = _chapter_id;
END;
$$;
