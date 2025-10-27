-- ============================================================================
-- Enable Row Level Security on all tables
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Grant permissions to authenticated role only (not anon)
-- ============================================================================

-- Users table
GRANT SELECT ON public.users TO authenticated;
GRANT INSERT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;

-- Events table
GRANT SELECT ON public.events TO authenticated;
GRANT INSERT ON public.events TO authenticated;
GRANT UPDATE ON public.events TO authenticated;
GRANT DELETE ON public.events TO authenticated;

-- Asks table
GRANT SELECT ON public.asks TO authenticated;
GRANT INSERT ON public.asks TO authenticated;
GRANT UPDATE ON public.asks TO authenticated;
GRANT DELETE ON public.asks TO authenticated;

-- Bids table
GRANT SELECT ON public.bids TO authenticated;
GRANT INSERT ON public.bids TO authenticated;
GRANT UPDATE ON public.bids TO authenticated;
GRANT DELETE ON public.bids TO authenticated;

-- Matches table
GRANT SELECT ON public.matches TO authenticated;

-- Tickets table
GRANT SELECT ON public.tickets TO authenticated;

-- ============================================================================
-- RLS Policies - USERS table
-- ============================================================================

-- All authenticated users can read all user profiles
CREATE POLICY "users_select_all"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile
CREATE POLICY "users_insert_own"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update only their own profile
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- RLS Policies - EVENTS table
-- ============================================================================

-- All authenticated users can read events (public marketplace)
CREATE POLICY "events_select_all"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create events (must set created_by to their own id)
CREATE POLICY "events_insert_own"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Only event creator can update their events
CREATE POLICY "events_update_own"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Only event creator can delete their events
CREATE POLICY "events_delete_own"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================================
-- RLS Policies - ASKS table
-- ============================================================================

-- All authenticated users can read asks (public marketplace)
CREATE POLICY "asks_select_all"
  ON public.asks
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create asks (must set seller_id to their own id)
CREATE POLICY "asks_insert_own"
  ON public.asks
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Only seller can update their asks
CREATE POLICY "asks_update_own"
  ON public.asks
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Only seller can delete their asks
CREATE POLICY "asks_delete_own"
  ON public.asks
  FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid());

-- ============================================================================
-- RLS Policies - BIDS table
-- ============================================================================

-- All authenticated users can read bids (public marketplace)
CREATE POLICY "bids_select_all"
  ON public.bids
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create bids (must set buyer_id to their own id)
CREATE POLICY "bids_insert_own"
  ON public.bids
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Only buyer can update their bids
CREATE POLICY "bids_update_own"
  ON public.bids
  FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Only buyer can delete their bids
CREATE POLICY "bids_delete_own"
  ON public.bids
  FOR DELETE
  TO authenticated
  USING (buyer_id = auth.uid());

-- ============================================================================
-- RLS Policies - MATCHES table
-- ============================================================================

-- Users can see matches where they are either the seller (via ask) or buyer (via bid)
CREATE POLICY "matches_select_involved"
  ON public.matches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.asks
      WHERE asks.id = matches.ask_id
      AND asks.seller_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.bids
      WHERE bids.id = matches.bid_id
      AND bids.buyer_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies - TICKETS table
-- ============================================================================

-- Users can only see their own tickets
CREATE POLICY "tickets_select_own"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (winner_id = auth.uid());
