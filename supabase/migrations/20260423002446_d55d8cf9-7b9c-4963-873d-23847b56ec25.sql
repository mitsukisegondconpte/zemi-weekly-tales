-- ============================================================
-- AUTHOR APPLICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.author_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bio text NOT NULL,
  motivation text NOT NULL,
  portfolio_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_author_apps_user ON public.author_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_author_apps_status ON public.author_applications(status);

ALTER TABLE public.author_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own applications"
  ON public.author_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own application"
  ON public.author_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all applications"
  ON public.author_applications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_author_apps_updated_at
  BEFORE UPDATE ON public.author_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CHAPTER MODERATION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chapter_moderation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  status text NOT NULL,
  admin_id uuid NOT NULL,
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chap_mod_chapter ON public.chapter_moderation(chapter_id);

ALTER TABLE public.chapter_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage moderation"
  ON public.chapter_moderation FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors view own chapter moderation"
  ON public.chapter_moderation FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters c
      WHERE c.id = chapter_moderation.chapter_id
        AND c.author_id = auth.uid()
    )
  );

-- ============================================================
-- USER NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  related_id uuid,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notif_user ON public.user_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notif_unread ON public.user_notifications(user_id) WHERE is_read = false;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.user_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.user_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.user_notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all user notifications"
  ON public.user_notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- AUTHOR ROLE HELPERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_author(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('author', 'verified_author', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_verified_author(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('verified_author', 'admin')
  )
$$;

-- ============================================================
-- UPDATED RLS POLICIES FOR novels
-- ============================================================
DROP POLICY IF EXISTS "Authors manage own novels" ON public.novels;
CREATE POLICY "Authors manage own novels"
  ON public.novels FOR ALL TO authenticated
  USING (auth.uid() = author_id AND public.is_author(auth.uid()))
  WITH CHECK (auth.uid() = author_id AND public.is_author(auth.uid()));

-- ============================================================
-- UPDATED RLS POLICIES FOR chapters
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read published chapter metadata" ON public.chapters;

CREATE POLICY "Public reads approved published chapters"
  ON public.chapters FOR SELECT TO public
  USING (status = 'published' AND moderation_status = 'approved');

CREATE POLICY "Authors view own chapters"
  ON public.chapters FOR SELECT TO authenticated
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors manage own chapters" ON public.chapters;
CREATE POLICY "Authors manage own chapters"
  ON public.chapters FOR ALL TO authenticated
  USING (auth.uid() = author_id AND public.is_author(auth.uid()))
  WITH CHECK (auth.uid() = author_id AND public.is_author(auth.uid()));

-- ============================================================
-- ENFORCE moderation_status on insert/update
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_chapter_moderation()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF public.is_verified_author(auth.uid()) THEN
    NEW.moderation_status := 'approved';
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.moderation_status := 'pending';
    NEW.status := 'draft';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
      NEW.moderation_status := OLD.moderation_status;
    END IF;
    IF NEW.status = 'published' AND OLD.moderation_status <> 'approved' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_chapter_moderation ON public.chapters;
CREATE TRIGGER trg_enforce_chapter_moderation
  BEFORE INSERT OR UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.enforce_chapter_moderation();

-- ============================================================
-- NOTIFICATION TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_application_decision()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted', 'rejected') THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, related_id, link)
    VALUES (
      NEW.user_id,
      'application_decision',
      CASE WHEN NEW.status = 'accepted' THEN 'Aplikasyon ote ou aksepte!' ELSE 'Aplikasyon ote ou refize' END,
      COALESCE(NEW.admin_notes, CASE WHEN NEW.status = 'accepted' THEN 'Ou ka kreye woman ak chapit kounye a.' ELSE 'Tanpri rete an kontak ak nou.' END),
      NEW.id,
      CASE WHEN NEW.status = 'accepted' THEN '/author/dashboard' ELSE '/profile' END
    );

    IF NEW.status = 'accepted' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'author')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application ON public.author_applications;
CREATE TRIGGER trg_notify_application
  AFTER UPDATE ON public.author_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_decision();

CREATE OR REPLACE FUNCTION public.notify_chapter_moderation()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _author_id uuid;
  _chapter_title text;
  _novel_id uuid;
BEGIN
  SELECT author_id, title, novel_id INTO _author_id, _chapter_title, _novel_id
  FROM public.chapters WHERE id = NEW.chapter_id;

  IF _author_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.chapters
  SET moderation_status = NEW.status,
      rejection_reason = CASE WHEN NEW.status = 'rejected' THEN NEW.reason ELSE NULL END,
      status = CASE WHEN NEW.status = 'approved' THEN 'published' ELSE status END
  WHERE id = NEW.chapter_id;

  INSERT INTO public.user_notifications (user_id, type, title, message, related_id, link)
  VALUES (
    _author_id,
    'chapter_moderation',
    CASE WHEN NEW.status = 'approved' THEN 'Chapit ou apwouve!' ELSE 'Chapit ou refize' END,
    'Chapit "' || _chapter_title || '" ' || CASE WHEN NEW.status = 'approved' THEN 'pibliye kounye a.' ELSE COALESCE('Rezon: ' || NEW.reason, 'Tanpri revize kontni an.') END,
    NEW.chapter_id,
    '/author/dashboard'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_chapter_mod ON public.chapter_moderation;
CREATE TRIGGER trg_notify_chapter_mod
  AFTER INSERT ON public.chapter_moderation
  FOR EACH ROW EXECUTE FUNCTION public.notify_chapter_moderation();

CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _author_id uuid;
  _chapter_title text;
BEGIN
  SELECT author_id, title INTO _author_id, _chapter_title
  FROM public.chapters WHERE id = NEW.chapter_id;

  IF _author_id IS NOT NULL AND _author_id <> NEW.user_id THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, related_id, link)
    VALUES (
      _author_id,
      'comment',
      'Nouvo komante',
      'Yon moun komante sou chapit "' || _chapter_title || '"',
      NEW.chapter_id,
      '/chapter/' || NEW.novel_id || '/' || NEW.chapter_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.comments;
CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_comment();

-- ============================================================
-- RPC: submit author application
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_author_application(
  _bio text,
  _motivation text,
  _portfolio_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _app_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF length(trim(_bio)) < 10 OR length(_bio) > 200 THEN
    RAISE EXCEPTION 'Bio must be between 10 and 200 characters';
  END IF;

  IF length(trim(_motivation)) < 20 THEN
    RAISE EXCEPTION 'Motivation must be at least 20 characters';
  END IF;

  IF public.is_author(_user_id) THEN
    RAISE EXCEPTION 'Already an author';
  END IF;

  IF EXISTS (SELECT 1 FROM public.author_applications WHERE user_id = _user_id AND status = 'pending') THEN
    RAISE EXCEPTION 'Application already pending';
  END IF;

  INSERT INTO public.author_applications (user_id, bio, motivation, portfolio_url)
  VALUES (_user_id, trim(_bio), trim(_motivation), NULLIF(trim(_portfolio_url), ''))
  RETURNING id INTO _app_id;

  INSERT INTO public.user_notifications (user_id, type, title, message, related_id, link)
  SELECT ur.user_id, 'system', 'Nouvo aplikasyon ote', 'Yon itilizate aplike pou vin ote.', _app_id, '/admin'
  FROM public.user_roles ur WHERE ur.role = 'admin';

  RETURN _app_id;
END;
$$;

-- ============================================================
-- RPC: moderate chapter (admin only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.moderate_chapter(
  _chapter_id uuid,
  _decision text,
  _reason text DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  INSERT INTO public.chapter_moderation (chapter_id, status, admin_id, reason, notes)
  VALUES (_chapter_id, _decision, auth.uid(), _reason, _notes);
END;
$$;

-- ============================================================
-- RPC: review author application (admin only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.review_author_application(
  _application_id uuid,
  _decision text,
  _admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _decision NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  UPDATE public.author_applications
  SET status = _decision,
      admin_notes = _admin_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = _application_id;
END;
$$;