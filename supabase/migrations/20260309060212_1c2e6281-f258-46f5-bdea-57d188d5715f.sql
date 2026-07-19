-- Step 1: Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Step 2: Authenticated users can view their own full profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 3: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 4: Create a public view with ONLY non-PII fields
-- Default security_invoker=false so it bypasses RLS - the view itself controls access
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  user_id,
  display_name,
  avatar_url,
  total_points,
  current_rank,
  total_kilometers
FROM public.profiles;