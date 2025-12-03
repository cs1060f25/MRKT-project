-- Fix users SELECT policy to satisfy all test expectations:
-- - Test 2: Policy must be named users_select_own
-- - Test 9: Authenticated users can only see their own profile
-- - Test 32: Anonymous users can see all users (school project transparency)

DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_all" ON public.users;

CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (
    (auth.jwt()->>'sub') = id  -- authenticated users see only themselves
    OR
    auth.role() = 'anon'       -- anonymous users see all
  );
