
-- Comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved comments" ON public.comments
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments" ON public.comments
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Ratings table (1-5 stars, one per user per novel)
CREATE TABLE public.novel_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, novel_id)
);

ALTER TABLE public.novel_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ratings" ON public.novel_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their rating" ON public.novel_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their rating" ON public.novel_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for chapter images
INSERT INTO storage.buckets (id, name, public) VALUES ('chapter-images', 'chapter-images', true);

CREATE POLICY "Admins can upload chapter images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'chapter-images' AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Anyone can view chapter images" ON storage.objects
  FOR SELECT USING (bucket_id = 'chapter-images');

CREATE POLICY "Admins can delete chapter images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'chapter-images' AND has_role(auth.uid(), 'admin')
  );

-- Add unique constraint for reading_history upsert
ALTER TABLE public.reading_history ADD CONSTRAINT reading_history_user_chapter_unique UNIQUE (user_id, chapter_id);
