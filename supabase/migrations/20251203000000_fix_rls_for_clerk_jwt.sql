-- ============================================================================
-- Fix RLS policies and RPC functions to use auth.jwt()->>'sub' for Clerk
-- ============================================================================
-- Clerk authentication uses JWT claims, not Supabase's native auth.uid().
-- This migration updates all policies and functions to use auth.jwt()->>'sub'
-- which extracts the Clerk user ID from the JWT token.

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = (auth.jwt()->>'sub'));

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = (auth.jwt()->>'sub'))
  WITH CHECK (id = (auth.jwt()->>'sub'));

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "events_insert_own" ON public.events;
CREATE POLICY "events_insert_own"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (auth.jwt()->>'sub'));

DROP POLICY IF EXISTS "events_update_own" ON public.events;
CREATE POLICY "events_update_own"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (created_by = (auth.jwt()->>'sub'))
  WITH CHECK (created_by = (auth.jwt()->>'sub'));

-- ============================================================================
-- ASKS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "asks_insert_own" ON public.asks;
CREATE POLICY "asks_insert_own"
  ON public.asks
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = (auth.jwt()->>'sub') AND status = 'open');

DROP POLICY IF EXISTS "asks_update_own" ON public.asks;
CREATE POLICY "asks_update_own"
  ON public.asks
  FOR UPDATE
  TO authenticated
  USING (seller_id = (auth.jwt()->>'sub') AND status = 'open')
  WITH CHECK (seller_id = (auth.jwt()->>'sub'));

-- ============================================================================
-- BIDS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "bids_insert_own" ON public.bids;
CREATE POLICY "bids_insert_own"
  ON public.bids
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = (auth.jwt()->>'sub') AND status = 'open');

DROP POLICY IF EXISTS "bids_update_own" ON public.bids;
CREATE POLICY "bids_update_own"
  ON public.bids
  FOR UPDATE
  TO authenticated
  USING (buyer_id = (auth.jwt()->>'sub') AND status = 'open')
  WITH CHECK (buyer_id = (auth.jwt()->>'sub'));

-- ============================================================================
-- TICKETS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "tickets_select_own" ON public.tickets;
CREATE POLICY "tickets_select_own"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    winner_id = (auth.jwt()->>'sub')
    OR EXISTS (
      SELECT 1 FROM asks
      WHERE asks.id = (
        SELECT matches.ask_id FROM matches WHERE matches.id = tickets.match_id
      )
      AND asks.seller_id = (auth.jwt()->>'sub')
    )
  );

DROP POLICY IF EXISTS "tickets_update_own" ON public.tickets;
CREATE POLICY "tickets_update_own"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    winner_id = (auth.jwt()->>'sub')
    OR EXISTS (
      SELECT 1 FROM asks
      WHERE asks.id = (
        SELECT matches.ask_id FROM matches WHERE matches.id = tickets.match_id
      )
      AND asks.seller_id = (auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    winner_id = (auth.jwt()->>'sub')
    OR EXISTS (
      SELECT 1 FROM asks
      WHERE asks.id = (
        SELECT matches.ask_id FROM matches WHERE matches.id = tickets.match_id
      )
      AND asks.seller_id = (auth.jwt()->>'sub')
    )
  );

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- rpc_create_event
CREATE OR REPLACE FUNCTION public.rpc_create_event(
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  org text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.events (id, title, starts_at, ends_at, org, created_by)
  VALUES (gen_random_uuid(), title, starts_at, ends_at, org, (auth.jwt()->>'sub'))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- rpc_create_ask
CREATE OR REPLACE FUNCTION public.rpc_create_ask(
  event_id uuid,
  price_cents integer,
  qty integer,
  qr_storage_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  VALUES (gen_random_uuid(), event_id, (auth.jwt()->>'sub'), price_cents, qty, qr_storage_path, 'open')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- rpc_create_bid
CREATE OR REPLACE FUNCTION public.rpc_create_bid(
  event_id uuid,
  price_cents integer,
  qty integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.bids (id, event_id, buyer_id, price_cents, qty, status)
  VALUES (gen_random_uuid(), event_id, (auth.jwt()->>'sub'), price_cents, qty, 'open')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- rpc_mark_ticket_delivered
CREATE OR REPLACE FUNCTION public.rpc_mark_ticket_delivered(ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winner_id text;
  v_seller_id text;
  v_delivered_at timestamptz;
  v_is_authorized boolean := false;
BEGIN
  -- Input validation
  IF ticket_id IS NULL THEN
    RAISE EXCEPTION 'ticket_id cannot be null';
  END IF;

  -- Check if ticket exists and get relevant data (bypasses RLS due to SECURITY DEFINER)
  SELECT t.winner_id, t.delivered_at, a.seller_id
  INTO v_winner_id, v_delivered_at, v_seller_id
  FROM public.tickets t
  JOIN public.matches m ON t.match_id = m.id
  JOIN public.asks a ON m.ask_id = a.id
  WHERE t.id = ticket_id;

  -- Check if ticket was found
  IF v_winner_id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  -- Check if already delivered
  IF v_delivered_at IS NOT NULL THEN
    RAISE EXCEPTION 'Ticket already delivered at %', v_delivered_at;
  END IF;

  -- Explicit authorization check: caller must be winner OR seller
  IF (auth.jwt()->>'sub') = v_winner_id OR (auth.jwt()->>'sub') = v_seller_id THEN
    v_is_authorized := true;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to deliver this ticket';
  END IF;

  -- Update ticket (this also bypasses RLS due to SECURITY DEFINER)
  UPDATE public.tickets
  SET delivered_at = now()
  WHERE id = ticket_id;
END;
$$;
