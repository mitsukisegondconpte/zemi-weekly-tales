
CREATE TABLE public.coin_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  coins integer NOT NULL DEFAULT 0,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage codes
CREATE POLICY "Admins can manage coin codes"
ON public.coin_codes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read active codes (for validation)
CREATE POLICY "Users can read active codes"
ON public.coin_codes FOR SELECT
TO authenticated
USING (is_active = true);

-- Track which users used which codes
CREATE TABLE public.code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_id uuid NOT NULL REFERENCES public.coin_codes(id) ON DELETE CASCADE,
  coins_received integer NOT NULL DEFAULT 0,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, code_id)
);

ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their redemptions"
ON public.code_redemptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their redemptions"
ON public.code_redemptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
