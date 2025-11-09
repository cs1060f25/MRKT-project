-- Migration: Fix rpc_create_bid to accept buyer_id as parameter
--
-- Problem: auth.uid() is NULL when Clerk JWT sync fails
-- Solution: Pass buyer_id directly from client (Clerk user ID)

CREATE OR REPLACE FUNCTION public.rpc_create_bid(
  event_id uuid,
  price_cents integer,
  qty integer,
  buyer_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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

  IF buyer_id IS NULL OR trim(buyer_id) = '' THEN
    RAISE EXCEPTION 'buyer_id cannot be null or empty';
  END IF;

  -- Insert bid with buyer_id from parameter (not auth.uid())
  INSERT INTO public.bids (id, event_id, buyer_id, price_cents, qty, status)
  VALUES (gen_random_uuid(), event_id, buyer_id, price_cents, qty, 'open')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;
