-- BUG 1: Allow authenticated users to read all profiles (needed for comments JOIN on display_name)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- BUG 2: Trigger to keep novels.reactions in sync with novel_reactions table
CREATE OR REPLACE FUNCTION public.sync_novel_reactions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.novels
    SET reactions = (SELECT COUNT(*) FROM public.novel_reactions WHERE novel_id = OLD.novel_id)
    WHERE id = OLD.novel_id;
  ELSE
    UPDATE public.novels
    SET reactions = (SELECT COUNT(*) FROM public.novel_reactions WHERE novel_id = NEW.novel_id)
    WHERE id = NEW.novel_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_reaction_change ON public.novel_reactions;
CREATE TRIGGER on_reaction_change
AFTER INSERT OR DELETE ON public.novel_reactions
FOR EACH ROW EXECUTE FUNCTION public.sync_novel_reactions();

-- Resync existing counts
UPDATE public.novels n
SET reactions = (SELECT COUNT(*) FROM public.novel_reactions WHERE novel_id = n.id);

-- BUG 4: Allow anyone (including non-authenticated) to read novel ratings
DROP POLICY IF EXISTS "Anyone can read ratings" ON public.novel_ratings;

CREATE POLICY "Anyone can read ratings"
ON public.novel_ratings FOR SELECT
USING (true);

-- BUG 11: Enable pg_cron extension and schedule auto-publish
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule existing job if any
DO $$
BEGIN
  PERFORM cron.unschedule('publish-scheduled-content');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'publish-scheduled-content',
  '* * * * *',
  $$SELECT public.publish_scheduled_content()$$
);

-- BUG 12: Remove hardcoded admin emails from handle_new_user (already done in prior migration but ensure it)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;