-- ============================================================================
-- RPC Functions: Add input validation and server-side constraints
-- ============================================================================
-- This migration adds validation guards to existing RPC functions to ensure
-- data integrity and proper error handling before database operations.

-- ============================================================================
-- rpc_create_event: Add input validation
-- ============================================================================
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
  -- Input validation
  IF title IS NULL OR trim(title) = '' THEN
    RAISE EXCEPTION 'title cannot be null or empty';
  END IF;

  IF starts_at IS NULL THEN
    RAISE EXCEPTION 'starts_at cannot be null';
  END IF;

  IF ends_at IS NULL THEN
    RAISE EXCEPTION 'ends_at cannot be null';
  END IF;

  IF org IS NULL OR trim(org) = '' THEN
    RAISE EXCEPTION 'org cannot be null or empty';
  END IF;

  IF starts_at >= ends_at THEN
    RAISE EXCEPTION 'starts_at must be before ends_at';
  END IF;

  -- Insert event
  INSERT INTO public.events (id, title, starts_at, ends_at, org, created_by)
  VALUES (gen_random_uuid(), title, starts_at, ends_at, org, auth.uid())
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ============================================================================
-- rpc_create_ask: Add input validation
-- ============================================================================
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
  -- Input validation
  IF event_id IS NULL THEN
    RAISE EXCEPTION 'event_id cannot be null';
  END IF;

  IF price_cents IS NULL THEN
    RAISE EXCEPTION 'price_cents cannot be null';
  END IF;

  IF price_cents <= 0 THEN
    RAISE EXCEPTION 'price_cents must be positive (got %)', price_cents;
  END IF;

  IF qty IS NULL THEN
    RAISE EXCEPTION 'qty cannot be null';
  END IF;

  IF qty <= 0 THEN
    RAISE EXCEPTION 'qty must be positive (got %)', qty;
  END IF;

  IF qr_storage_path IS NULL OR trim(qr_storage_path) = '' THEN
    RAISE EXCEPTION 'qr_storage_path cannot be null or empty';
  END IF;

  -- Insert ask
  INSERT INTO public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  VALUES (gen_random_uuid(), event_id, auth.uid(), price_cents, qty, qr_storage_path, 'open')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ============================================================================
-- rpc_create_bid: Add input validation
-- ============================================================================
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
  -- Input validation
  IF event_id IS NULL THEN
    RAISE EXCEPTION 'event_id cannot be null';
  END IF;

  IF price_cents IS NULL THEN
    RAISE EXCEPTION 'price_cents cannot be null';
  END IF;

  IF price_cents <= 0 THEN
    RAISE EXCEPTION 'price_cents must be positive (got %)', price_cents;
  END IF;

  IF qty IS NULL THEN
    RAISE EXCEPTION 'qty cannot be null';
  END IF;

  IF qty <= 0 THEN
    RAISE EXCEPTION 'qty must be positive (got %)', qty;
  END IF;

  -- Insert bid
  INSERT INTO public.bids (id, event_id, buyer_id, price_cents, qty, status)
  VALUES (gen_random_uuid(), event_id, auth.uid(), price_cents, qty, 'open')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ============================================================================
-- rpc_get_book: Add input validation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_get_book(event_id uuid)
RETURNS TABLE(book_side text, price_cents integer, qty integer)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  -- Input validation
  IF event_id IS NULL THEN
    RAISE EXCEPTION 'event_id cannot be null';
  END IF;

  -- Return aggregated order book
  RETURN QUERY
  SELECT 'ask'::text AS book_side, a.price_cents, SUM(a.qty)::integer AS qty
  FROM public.asks a
  WHERE a.event_id = rpc_get_book.event_id
    AND a.status = 'open'
  GROUP BY a.price_cents

  UNION ALL

  SELECT 'bid'::text AS book_side, b.price_cents, SUM(b.qty)::integer AS qty
  FROM public.bids b
  WHERE b.event_id = rpc_get_book.event_id
    AND b.status = 'open'
  GROUP BY b.price_cents

  ORDER BY book_side, price_cents;
END;
$$;

-- ============================================================================
-- rpc_mark_ticket_delivered: Add explicit access control and validation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_mark_ticket_delivered(ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_winner_id uuid;
  v_seller_id uuid;
  v_delivered_at timestamptz;
  v_is_authorized boolean := false;
BEGIN
  -- Input validation
  IF ticket_id IS NULL THEN
    RAISE EXCEPTION 'ticket_id cannot be null';
  END IF;

  -- Check if ticket exists and get relevant data
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
  IF auth.uid() = v_winner_id OR auth.uid() = v_seller_id THEN
    v_is_authorized := true;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to deliver this ticket';
  END IF;

  -- Update ticket
  UPDATE public.tickets
  SET delivered_at = now()
  WHERE id = ticket_id;
END;
$$;
