-- Change user IDs from UUID to TEXT to support Clerk user IDs
-- Clerk uses string IDs like "user_34vzEy76jAWsF3V3TxIo2miUmJk" which are not UUIDs

-- Step 1: Drop ALL RLS policies from all tables (including storage)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop public schema policies
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
    
    -- Drop storage schema policies
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'storage')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Step 2: Drop foreign key constraints
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE public.asks DROP CONSTRAINT IF EXISTS asks_seller_id_fkey;
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_buyer_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_winner_id_fkey;

-- Step 3: Change users.id to TEXT
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Step 4: Change all referencing columns to TEXT
ALTER TABLE public.events ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
ALTER TABLE public.asks ALTER COLUMN seller_id TYPE TEXT USING seller_id::TEXT;
ALTER TABLE public.bids ALTER COLUMN buyer_id TYPE TEXT USING buyer_id::TEXT;
ALTER TABLE public.tickets ALTER COLUMN winner_id TYPE TEXT USING winner_id::TEXT;

-- Step 5: Recreate foreign key constraints
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

-- Step 6: Grant necessary privileges
GRANT UPDATE ON public.users TO authenticated;

-- Step 7: Recreate RLS policies (adapted for TEXT IDs)
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (id = auth.uid()::TEXT);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (id = auth.uid()::TEXT)
  WITH CHECK (id = auth.uid()::TEXT);

CREATE POLICY events_select_all ON public.events
  FOR SELECT USING (true);

CREATE POLICY events_insert_own ON public.events
  FOR INSERT WITH CHECK (created_by = auth.uid()::TEXT);

CREATE POLICY events_update_own ON public.events
  FOR UPDATE USING (created_by = auth.uid()::TEXT);

CREATE POLICY asks_select_all ON public.asks
  FOR SELECT USING (true);

CREATE POLICY asks_insert_own ON public.asks
  FOR INSERT WITH CHECK (seller_id = auth.uid()::TEXT AND status = 'open');

CREATE POLICY asks_update_own ON public.asks
  FOR UPDATE USING (seller_id = auth.uid()::TEXT AND status = 'open');

CREATE POLICY bids_select_all ON public.bids
  FOR SELECT USING (true);

CREATE POLICY bids_insert_own ON public.bids
  FOR INSERT WITH CHECK (buyer_id = auth.uid()::TEXT AND status = 'open');

CREATE POLICY bids_update_own ON public.bids
  FOR UPDATE USING (buyer_id = auth.uid()::TEXT AND status = 'open');

CREATE POLICY matches_select_all ON public.matches
  FOR SELECT USING (true);

CREATE POLICY tickets_select_own ON public.tickets
  FOR SELECT USING (winner_id = auth.uid()::TEXT OR EXISTS (
    SELECT 1 FROM public.asks WHERE asks.id = (
      SELECT ask_id FROM public.matches WHERE matches.id = tickets.match_id
    ) AND asks.seller_id = auth.uid()::TEXT
  ));

CREATE POLICY tickets_update_own ON public.tickets
  FOR UPDATE USING (winner_id = auth.uid()::TEXT OR EXISTS (
    SELECT 1 FROM public.asks WHERE asks.id = (
      SELECT ask_id FROM public.matches WHERE matches.id = tickets.match_id
    ) AND asks.seller_id = auth.uid()::TEXT
  ));

-- Step 8: Recreate storage policies for QR codes
CREATE POLICY qr_codes_insert_seller
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'qr_codes'
    AND EXISTS (
      SELECT 1
      FROM public.asks
      WHERE asks.id::text = split_part(name, '/', 2)
        AND asks.seller_id = auth.uid()::TEXT
    )
  );

CREATE POLICY qr_codes_select_authorized
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'qr_codes'
    AND (
      EXISTS (
        SELECT 1
        FROM public.asks
        WHERE asks.id::text = split_part(name, '/', 2)
          AND asks.seller_id = auth.uid()::TEXT
      )
      OR EXISTS (
        SELECT 1
        FROM public.tickets
        WHERE tickets.id::text = split_part(name, '/', 2)
          AND tickets.winner_id = auth.uid()::TEXT
      )
    )
  );

CREATE POLICY qr_codes_delete_seller
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'qr_codes'
    AND EXISTS (
      SELECT 1
      FROM public.asks
      WHERE asks.id::text = split_part(name, '/', 2)
        AND asks.seller_id = auth.uid()::TEXT
        AND asks.status = 'open'
    )
  );

