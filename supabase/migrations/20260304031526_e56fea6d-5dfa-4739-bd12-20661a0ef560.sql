
-- Function to redeem a code atomically
CREATE OR REPLACE FUNCTION public.redeem_coin_code(_user_id uuid, _code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code_record record;
  _coins_to_add integer;
BEGIN
  -- Find active code
  SELECT * INTO _code_record FROM public.coin_codes
  WHERE code = upper(_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code not found or inactive';
  END IF;
  
  IF _code_record.used_count >= _code_record.max_uses THEN
    RAISE EXCEPTION 'Code has reached maximum uses';
  END IF;
  
  -- Check if already redeemed by this user
  IF EXISTS (SELECT 1 FROM public.code_redemptions WHERE user_id = _user_id AND code_id = _code_record.id) THEN
    RAISE EXCEPTION 'Code already redeemed by this user';
  END IF;
  
  _coins_to_add := _code_record.coins;
  
  -- Update used count
  UPDATE public.coin_codes SET used_count = used_count + 1 WHERE id = _code_record.id;
  
  -- Add coins to profile
  UPDATE public.profiles SET coins = coins + _coins_to_add WHERE user_id = _user_id;
  
  -- Record redemption
  INSERT INTO public.code_redemptions (user_id, code_id, coins_received)
  VALUES (_user_id, _code_record.id, _coins_to_add);
  
  RETURN _coins_to_add;
END;
$$;
