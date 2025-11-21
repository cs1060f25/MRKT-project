-- ============================================================================
-- Migration: Public Matches RLS
-- Description: Make matches table publicly readable for all authenticated users
-- ============================================================================

-- Drop existing restrictive policy that only allows involved parties to see matches
DROP POLICY IF EXISTS "matches_select_involved" ON public.matches;

-- Drop the policy if it already exists (from previous migrations)
DROP POLICY IF EXISTS "matches_select_all" ON public.matches;

-- Create new public read policy for all authenticated users
-- This allows transparent market data visibility while maintaining write restrictions
CREATE POLICY "matches_select_all"
  ON public.matches
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: INSERT, UPDATE, DELETE operations remain restricted to service role
-- via the absence of policies (RLS enabled but no permissive policies for those operations)

