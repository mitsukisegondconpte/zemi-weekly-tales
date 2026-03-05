
-- Reading history table
CREATE TABLE public.reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  novel_id uuid NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their reading history" ON public.reading_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their reading history" ON public.reading_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their reading history" ON public.reading_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Favorites table
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  novel_id uuid NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, novel_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their favorites" ON public.favorites
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Scheduled publishing: add scheduled_at to chapters and novels
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT NULL;
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT NULL;

-- Function to auto-publish scheduled content
CREATE OR REPLACE FUNCTION public.publish_scheduled_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.novels SET status = 'published' WHERE status = 'draft' AND scheduled_at IS NOT NULL AND scheduled_at <= now();
  UPDATE public.chapters SET status = 'published' WHERE status = 'draft' AND scheduled_at IS NOT NULL AND scheduled_at <= now();
END;
$$;

-- Unlock chapter securely via RPC (prevents client-side coin manipulation)
CREATE OR REPLACE FUNCTION public.unlock_chapter(_user_id uuid, _chapter_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _chapter record;
  _current_coins integer;
BEGIN
  -- Get chapter info
  SELECT * INTO _chapter FROM public.chapters WHERE id = _chapter_id AND status = 'published';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chapter not found';
  END IF;
  
  -- Free chapter
  IF NOT _chapter.is_premium OR _chapter.coin_price = 0 THEN
    RETURN 0;
  END IF;
  
  -- Already unlocked?
  IF EXISTS (SELECT 1 FROM public.unlocked_chapters WHERE user_id = _user_id AND chapter_id = _chapter_id) THEN
    RETURN 0;
  END IF;
  
  -- Check coins
  SELECT coins INTO _current_coins FROM public.profiles WHERE user_id = _user_id;
  IF _current_coins IS NULL OR _current_coins < _chapter.coin_price THEN
    RAISE EXCEPTION 'Not enough coins. Need % but have %', _chapter.coin_price, COALESCE(_current_coins, 0);
  END IF;
  
  -- Deduct coins
  UPDATE public.profiles SET coins = coins - _chapter.coin_price WHERE user_id = _user_id;
  
  -- Record unlock
  INSERT INTO public.unlocked_chapters (user_id, chapter_id, coins_spent) VALUES (_user_id, _chapter_id, _chapter.coin_price);
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (_user_id, 'purchase', 'Chapit Debloke', _chapter.coin_price || ' coins retire pou chapit: ' || _chapter.title);
  
  RETURN _chapter.coin_price;
END;
$$;
