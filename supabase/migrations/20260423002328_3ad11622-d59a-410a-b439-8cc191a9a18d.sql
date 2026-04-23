-- Add new role values (must be alone in transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'author';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'verified_author';

-- Extend chapters
ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS author_id uuid,
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS idx_chapters_author ON public.chapters(author_id);
CREATE INDEX IF NOT EXISTS idx_chapters_mod_status ON public.chapters(moderation_status);

-- Backfill existing published chapters as approved
UPDATE public.chapters SET moderation_status = 'approved' WHERE status = 'published';

-- Extend novels
ALTER TABLE public.novels
  ADD COLUMN IF NOT EXISTS author_id uuid;

UPDATE public.novels SET author_id = created_by WHERE author_id IS NULL AND created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_novels_author ON public.novels(author_id);