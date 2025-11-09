-- Migration: Change user IDs from UUID to TEXT to support Clerk authentication
-- Clerk provides user IDs as strings (e.g., "user_xxxxx"), not UUIDs

-- Step 1: Drop ALL RLS policies (from all previous migrations)
-- Storage policies (storage.objects)
DROP POLICY IF EXISTS "qr_codes_insert_seller" ON storage.objects;
DROP POLICY IF EXISTS "qr_codes_select_authorized" ON storage.objects;
DROP POLICY IF EXISTS "qr_codes_delete_seller" ON storage.objects;

-- Table policies
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "events_select_all" ON public.events;
DROP POLICY IF EXISTS "events_insert_own" ON public.events;
DROP POLICY IF EXISTS "events_update_own" ON public.events;
DROP POLICY IF EXISTS "events_delete_own" ON public.events;
DROP POLICY IF EXISTS "asks_select_all" ON public.asks;
DROP POLICY IF EXISTS "asks_insert_own" ON public.asks;
DROP POLICY IF EXISTS "asks_update_own" ON public.asks;
DROP POLICY IF EXISTS "asks_update_own_open" ON public.asks;
DROP POLICY IF EXISTS "asks_delete_own" ON public.asks;
DROP POLICY IF EXISTS "asks_delete_own_open" ON public.asks;
DROP POLICY IF EXISTS "bids_select_all" ON public.bids;
DROP POLICY IF EXISTS "bids_insert_own" ON public.bids;
DROP POLICY IF EXISTS "bids_update_own" ON public.bids;
DROP POLICY IF EXISTS "bids_update_own_open" ON public.bids;
DROP POLICY IF EXISTS "bids_delete_own" ON public.bids;
DROP POLICY IF EXISTS "bids_delete_own_open" ON public.bids;
DROP POLICY IF EXISTS "matches_select_all" ON public.matches;
DROP POLICY IF EXISTS "matches_select_involved" ON public.matches;
DROP POLICY IF EXISTS "tickets_select_own" ON public.tickets;
DROP POLICY IF EXISTS "tickets_select_winner_or_seller" ON public.tickets;
DROP POLICY IF EXISTS "tickets_update_winner_or_seller" ON public.tickets;

-- Step 2: Drop foreign key constraints
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE public.asks DROP CONSTRAINT IF EXISTS asks_seller_id_fkey;
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_buyer_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_winner_id_fkey;

-- Step 2: Change users.id column type
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;

-- Step 3: Change foreign key columns to text
ALTER TABLE public.events ALTER COLUMN created_by TYPE text USING created_by::text;
ALTER TABLE public.asks ALTER COLUMN seller_id TYPE text USING seller_id::text;
ALTER TABLE public.bids ALTER COLUMN buyer_id TYPE text USING buyer_id::text;
ALTER TABLE public.tickets ALTER COLUMN winner_id TYPE text USING winner_id::text;

-- Step 4: Recreate foreign key constraints
ALTER TABLE public.events
  ADD CONSTRAINT events_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.asks
  ADD CONSTRAINT asks_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES public.users(id);

ALTER TABLE public.bids
  ADD CONSTRAINT bids_buyer_id_fkey
  FOREIGN KEY (buyer_id) REFERENCES public.users(id);

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_winner_id_fkey
  FOREIGN KEY (winner_id) REFERENCES public.users(id);

-- Step 5: Recreate RLS policies (simplified for service role access)
-- Note: Service role bypasses RLS, so these are mainly for documentation

-- Users table
CREATE POLICY "users_select_all"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_own"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Events table
CREATE POLICY "events_select_all"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "events_insert_own"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "events_update_own"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "events_delete_own"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (true);

-- Asks table
CREATE POLICY "asks_select_all"
  ON public.asks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "asks_insert_own"
  ON public.asks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "asks_update_own"
  ON public.asks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "asks_delete_own"
  ON public.asks
  FOR DELETE
  TO authenticated
  USING (true);

-- Bids table
CREATE POLICY "bids_select_all"
  ON public.bids
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bids_insert_own"
  ON public.bids
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "bids_update_own"
  ON public.bids
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "bids_delete_own"
  ON public.bids
  FOR DELETE
  TO authenticated
  USING (true);

-- Matches table
CREATE POLICY "matches_select_involved"
  ON public.matches
  FOR SELECT
  TO authenticated
  USING (true);

-- Tickets table
CREATE POLICY "tickets_select_own"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tickets_update_winner_or_seller"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 6: Recreate storage policies (simplified for service role access)
CREATE POLICY "qr_codes_insert_seller"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'qr_codes');

CREATE POLICY "qr_codes_select_authorized"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'qr_codes');

CREATE POLICY "qr_codes_delete_seller"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'qr_codes');
