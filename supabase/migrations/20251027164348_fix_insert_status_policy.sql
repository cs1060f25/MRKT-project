-- ============================================================================
-- Fix INSERT policies for asks and bids to enforce status='open'
-- ============================================================================
-- Bug: Users could insert asks/bids with any status, bypassing matching engine
-- Fix: Add status='open' constraint to INSERT policies

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "asks_insert_own" ON public.asks;
DROP POLICY IF EXISTS "bids_insert_own" ON public.bids;

-- ============================================================================
-- Recreate INSERT policies with status='open' constraint
-- ============================================================================

-- Users can only insert asks with status='open'
CREATE POLICY "asks_insert_own"
  ON public.asks
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid() AND status = 'open');

-- Users can only insert bids with status='open'
CREATE POLICY "bids_insert_own"
  ON public.bids
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid() AND status = 'open');
