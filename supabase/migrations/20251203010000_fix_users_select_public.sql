-- Fix users SELECT policy to allow public access
-- The previous migration restricted to authenticated users only,
-- but this school project requires public market transparency

DROP POLICY IF EXISTS "users_select_own" ON public.users;

-- Allow anyone (authenticated or anonymous) to view all users
CREATE POLICY "users_select_all"
  ON public.users
  FOR SELECT
  TO public
  USING (true);
