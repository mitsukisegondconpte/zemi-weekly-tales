
-- Genres enum
CREATE TYPE public.novel_genre AS ENUM ('Romantik', 'Dram', 'Avanti', 'Thriller', 'Fanmi', 'Fantezi', 'Aksyon', 'Komedi', 'Orre', 'Syans-Fiksyon');

-- Novels table
CREATE TABLE public.novels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  genre novel_genre NOT NULL DEFAULT 'Dram',
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by UUID REFERENCES auth.users(id),
  reactions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  chapter_number INTEGER NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  coin_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(novel_id, chapter_number)
);

-- Unlocked chapters (tracks which user unlocked which premium chapter)
CREATE TABLE public.unlocked_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  coins_spent INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Novel reactions
CREATE TABLE public.novel_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, novel_id)
);

-- Enable RLS
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novel_reactions ENABLE ROW LEVEL SECURITY;

-- Novels: everyone can read published, admins can CRUD
CREATE POLICY "Anyone can read published novels" ON public.novels FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can do everything on novels" ON public.novels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Chapters: everyone can read published, admins can CRUD
CREATE POLICY "Anyone can read published chapters" ON public.chapters FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can do everything on chapters" ON public.chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Unlocked chapters: users see their own, insert their own
CREATE POLICY "Users can view their unlocked chapters" ON public.unlocked_chapters FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can unlock chapters" ON public.unlocked_chapters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Novel reactions: users manage their own
CREATE POLICY "Users can view reactions" ON public.novel_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.novel_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove reactions" ON public.novel_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_novels_updated_at BEFORE UPDATE ON public.novels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for novels and chapters
ALTER PUBLICATION supabase_realtime ADD TABLE public.novels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chapters;
