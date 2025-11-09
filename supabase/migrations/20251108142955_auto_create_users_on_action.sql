-- Migration: Auto-create users on first action to prevent foreign key errors
--
-- Problem: Users must exist in users table before they can create bids/asks,
-- but we don't have a user registration flow. This causes foreign key errors.
--
-- Solution:
-- 1. Make users.email nullable (we may not have it from Clerk)
-- 2. Create helper function to auto-create users
-- 3. Update RPC functions to call helper before inserts

-- Step 1: Make email nullable
ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL;

-- Step 2: Create helper function to ensure user exists
CREATE OR REPLACE FUNCTION public.ensure_user_exists(
  p_user_id text,
  p_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Needs elevated privileges to bypass RLS
AS $$
BEGIN
  -- Idempotent insert: create user if doesn't exist
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (p_user_id, p_email, NULL, now())
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Step 3: Update rpc_create_bid to auto-create buyer
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

  -- Ensure user exists before insert (prevents foreign key error)
  PERFORM ensure_user_exists(buyer_id);

  -- Insert bid
  INSERT INTO public.bids (id, event_id, buyer_id, price_cents, qty, status)
  VALUES (gen_random_uuid(), event_id, buyer_id, price_cents, qty, 'open')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Step 4: Update rpc_create_ask to accept seller_id and auto-create seller
-- (This makes it consistent with rpc_create_bid pattern)
CREATE OR REPLACE FUNCTION public.rpc_create_ask(
  event_id uuid,
  price_cents integer,
  qty integer,
  qr_storage_path text,
  seller_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER  -- Changed from INVOKER to DEFINER
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

  IF seller_id IS NULL OR trim(seller_id) = '' THEN
    RAISE EXCEPTION 'seller_id cannot be null or empty';
  END IF;

  -- Ensure user exists before insert (prevents foreign key error)
  PERFORM ensure_user_exists(seller_id);

  -- Insert ask
  INSERT INTO public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  VALUES (gen_random_uuid(), event_id, seller_id, price_cents, qty, qr_storage_path, 'open')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Step 5: Update function signature grants
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_create_bid(uuid, integer, integer, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_create_ask(uuid, integer, integer, text, text) TO authenticated, anon;
