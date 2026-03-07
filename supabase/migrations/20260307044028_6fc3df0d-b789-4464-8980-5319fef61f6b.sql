
-- Fix comments RLS: change restrictive policies to permissive
DROP POLICY IF EXISTS "Anyone can read approved comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.comments;

CREATE POLICY "Anyone can read approved comments"
ON public.comments FOR SELECT
TO authenticated
USING (is_approved = true);

CREATE POLICY "Authenticated users can insert comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
ON public.comments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix favorites
DROP POLICY IF EXISTS "Users can manage their favorites" ON public.favorites;
CREATE POLICY "Users can manage their favorites"
ON public.favorites FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix novel_ratings
DROP POLICY IF EXISTS "Anyone can read ratings" ON public.novel_ratings;
DROP POLICY IF EXISTS "Users can insert their rating" ON public.novel_ratings;
DROP POLICY IF EXISTS "Users can update their rating" ON public.novel_ratings;
CREATE POLICY "Anyone can read ratings"
ON public.novel_ratings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their rating"
ON public.novel_ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their rating"
ON public.novel_ratings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix reading_history
DROP POLICY IF EXISTS "Users can view their reading history" ON public.reading_history;
DROP POLICY IF EXISTS "Users can insert their reading history" ON public.reading_history;
DROP POLICY IF EXISTS "Users can update their reading history" ON public.reading_history;
CREATE POLICY "Users can view their reading history"
ON public.reading_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their reading history"
ON public.reading_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reading history"
ON public.reading_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix unlocked_chapters
DROP POLICY IF EXISTS "Users can view their unlocked chapters" ON public.unlocked_chapters;
DROP POLICY IF EXISTS "Users can unlock chapters" ON public.unlocked_chapters;
CREATE POLICY "Users can view their unlocked chapters"
ON public.unlocked_chapters FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock chapters"
ON public.unlocked_chapters FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix user_roles
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix novel_reactions
DROP POLICY IF EXISTS "Users can view reactions" ON public.novel_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON public.novel_reactions;
DROP POLICY IF EXISTS "Users can remove reactions" ON public.novel_reactions;
CREATE POLICY "Users can view reactions"
ON public.novel_reactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add reactions"
ON public.novel_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove reactions"
ON public.novel_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix code_redemptions
DROP POLICY IF EXISTS "Users can view their redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Users can insert their redemptions" ON public.code_redemptions;
CREATE POLICY "Users can view their redemptions"
ON public.code_redemptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their redemptions"
ON public.code_redemptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
