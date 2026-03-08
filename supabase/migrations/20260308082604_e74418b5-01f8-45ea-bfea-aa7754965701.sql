
-- Fix 1: Remove _user_id param from unlock_chapter, use auth.uid() instead
CREATE OR REPLACE FUNCTION public.unlock_chapter(_chapter_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _chapter record;
  _current_coins integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _chapter FROM public.chapters WHERE id = _chapter_id AND status = 'published';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chapter not found';
  END IF;

  IF NOT _chapter.is_premium OR _chapter.coin_price = 0 THEN
    RETURN 0;
  END IF;

  IF EXISTS (SELECT 1 FROM public.unlocked_chapters WHERE user_id = _user_id AND chapter_id = _chapter_id) THEN
    RETURN 0;
  END IF;

  SELECT coins INTO _current_coins FROM public.profiles WHERE user_id = _user_id;
  IF _current_coins IS NULL OR _current_coins < _chapter.coin_price THEN
    RAISE EXCEPTION 'Not enough coins. Need % but have %', _chapter.coin_price, COALESCE(_current_coins, 0);
  END IF;

  UPDATE public.profiles SET coins = coins - _chapter.coin_price WHERE user_id = _user_id;

  INSERT INTO public.unlocked_chapters (user_id, chapter_id, coins_spent) VALUES (_user_id, _chapter_id, _chapter.coin_price);

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (_user_id, 'purchase', 'Chapit Debloke', _chapter.coin_price || ' coins retire pou chapit: ' || _chapter.title);

  RETURN _chapter.coin_price;
END;
$$;

-- Fix 2: Remove _user_id param from redeem_coin_code, use auth.uid() instead
CREATE OR REPLACE FUNCTION public.redeem_coin_code(_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _code_record record;
  _coins_to_add integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _code_record FROM public.coin_codes
  WHERE code = upper(_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code not found or inactive';
  END IF;
  
  IF _code_record.used_count >= _code_record.max_uses THEN
    RAISE EXCEPTION 'Code has reached maximum uses';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.code_redemptions WHERE user_id = _user_id AND code_id = _code_record.id) THEN
    RAISE EXCEPTION 'Code already redeemed by this user';
  END IF;
  
  _coins_to_add := _code_record.coins;
  
  UPDATE public.coin_codes SET used_count = used_count + 1 WHERE id = _code_record.id;
  UPDATE public.profiles SET coins = coins + _coins_to_add WHERE user_id = _user_id;
  
  INSERT INTO public.code_redemptions (user_id, code_id, coins_received)
  VALUES (_user_id, _code_record.id, _coins_to_add);
  
  RETURN _coins_to_add;
END;
$$;

-- Fix 3: Protect coins column from direct user manipulation
CREATE OR REPLACE FUNCTION public.protect_coins_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If coins value is changing and caller is not admin, reject
  IF NEW.coins IS DISTINCT FROM OLD.coins THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.coins := OLD.coins; -- silently revert coin changes
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_coins_on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_coins_column();
