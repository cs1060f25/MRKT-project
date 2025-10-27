-- ============================================================================
-- RPC Surface: Public functions for controlled server-side data access
-- ============================================================================
-- These functions wrap common writes with server-side checks to prevent
-- clients from spoofing user identities. RLS policies still apply.

-- ============================================================================
-- rpc_create_event: Create event with authenticated user as creator
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
  INSERT INTO public.events (id, title, starts_at, ends_at, org, created_by)
  VALUES (gen_random_uuid(), title, starts_at, ends_at, org, auth.uid())
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ============================================================================
-- rpc_create_ask: Create ask with authenticated user as seller
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
  INSERT INTO public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  VALUES (gen_random_uuid(), event_id, auth.uid(), price_cents, qty, qr_storage_path, 'open')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ============================================================================
-- rpc_create_bid: Create bid with authenticated user as buyer
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
  INSERT INTO public.bids (id, event_id, buyer_id, price_cents, qty, status)
  VALUES (gen_random_uuid(), event_id, auth.uid(), price_cents, qty, 'open')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ============================================================================
-- rpc_get_book: Get aggregated order book for an event
-- ============================================================================
-- Returns both sides (asks and bids) aggregated by price level
CREATE OR REPLACE FUNCTION public.rpc_get_book(event_id uuid)
RETURNS TABLE(book_side text, price_cents integer, qty integer)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
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
$$;

-- ============================================================================
-- rpc_mark_ticket_delivered: Mark ticket as delivered
-- ============================================================================
-- Access control enforced by existing RLS policies on tickets table
CREATE OR REPLACE FUNCTION public.rpc_mark_ticket_delivered(ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.tickets
  SET delivered_at = now()
  WHERE id = ticket_id;
END;
$$;

-- ============================================================================
-- rpc_health: Health check endpoint
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_health()
RETURNS text
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 'ok'::text;
$$;

-- ============================================================================
-- Grant execute permissions to authenticated role
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.rpc_create_event(text, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_create_ask(uuid, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_create_bid(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_book(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_mark_ticket_delivered(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_health() TO authenticated;
