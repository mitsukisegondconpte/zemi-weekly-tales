
-- Fix 1: Drop the overly-broad coin_codes SELECT policy that exposes promo codes
DROP POLICY IF EXISTS "Users can read active codes" ON public.coin_codes;

-- Fix 2: Remove hardcoded admin emails from the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$function$;

-- Fix 3: Drop the old insecure overloads that accept user_id parameter
DROP FUNCTION IF EXISTS public.unlock_chapter(uuid, uuid);
DROP FUNCTION IF EXISTS public.redeem_coin_code(uuid, text);
