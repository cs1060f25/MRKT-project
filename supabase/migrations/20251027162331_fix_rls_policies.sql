-- ============================================================================
-- Drop all existing RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

DROP POLICY IF EXISTS "asks_update_own" ON public.asks;
DROP POLICY IF EXISTS "asks_delete_own" ON public.asks;

DROP POLICY IF EXISTS "bids_update_own" ON public.bids;
DROP POLICY IF EXISTS "bids_delete_own" ON public.bids;

DROP POLICY IF EXISTS "matches_select_involved" ON public.matches;

DROP POLICY IF EXISTS "tickets_select_own" ON public.tickets;

-- ============================================================================
-- Revoke incorrect grants
-- ============================================================================

REVOKE INSERT ON public.users FROM authenticated;
REVOKE UPDATE ON public.users FROM authenticated;

-- ============================================================================
-- Create corrected RLS policies - USERS table
-- ============================================================================

-- User can only read their own row
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- No INSERT policy (server-side only)
-- No UPDATE policy (denied)
-- No DELETE policy (denied)

-- ============================================================================
-- Create corrected RLS policies - ASKS table
-- ============================================================================

-- Only seller can update their asks, and only if status = 'open'
CREATE POLICY "asks_update_own_open"
  ON public.asks
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid() AND status = 'open')
  WITH CHECK (seller_id = auth.uid() AND status = 'open');

-- Only seller can delete their asks, and only if status = 'open'
CREATE POLICY "asks_delete_own_open"
  ON public.asks
  FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid() AND status = 'open');

-- ============================================================================
-- Create corrected RLS policies - BIDS table
-- ============================================================================

-- Only buyer can update their bids, and only if status = 'open'
CREATE POLICY "bids_update_own_open"
  ON public.bids
  FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() AND status = 'open')
  WITH CHECK (buyer_id = auth.uid() AND status = 'open');

-- Only buyer can delete their bids, and only if status = 'open'
CREATE POLICY "bids_delete_own_open"
  ON public.bids
  FOR DELETE
  TO authenticated
  USING (buyer_id = auth.uid() AND status = 'open');

-- ============================================================================
-- Create corrected RLS policies - MATCHES table
-- ============================================================================

-- Any authenticated user can read matches (market transparency)
CREATE POLICY "matches_select_all"
  ON public.matches
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Create corrected RLS policies - TICKETS table
-- ============================================================================

-- Users can see tickets if they are the winner OR the seller who originated the matched ask
CREATE POLICY "tickets_select_winner_or_seller"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    winner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM public.matches
      JOIN public.asks ON matches.ask_id = asks.id
      WHERE tickets.match_id = matches.id
      AND asks.seller_id = auth.uid()
    )
  );
