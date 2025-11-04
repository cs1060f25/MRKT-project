-- RLS Policies for QR Codes Storage Bucket
-- Implements granular access control for storage.objects where bucket_id = 'qr_codes'
--
-- Path Convention: {event_id}/{ask_id or ticket_id}/qr.png
--
-- Access Rules:
-- - INSERT (upload): Only sellers can upload QR codes for their own asks
-- - SELECT (read): Sellers can read their ask QRs, Winners can read their ticket QRs
-- - UPDATE: Denied (immutable files)
-- - DELETE: Only sellers can delete QR codes for their open asks

-- NOTE: RLS is already enabled on storage.objects by default in Supabase
-- No need to ALTER TABLE here as we don't have ownership

-- ============================================================================
-- POLICY: qr_codes_insert_seller
-- Allow sellers to upload QR codes for asks they own
-- ============================================================================
CREATE POLICY qr_codes_insert_seller
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'qr_codes'
  AND
  -- Extract ask_id from path: {event_id}/{ask_id}/qr.png
  -- Path format is validated: must be UUID/UUID/qr.png or UUID/UUID/qr.jpeg
  (
    -- Check if user owns the ask (seller_id = auth.uid())
    EXISTS (
      SELECT 1
      FROM public.asks
      WHERE asks.id::text = split_part(name, '/', 2)
        AND asks.seller_id = auth.uid()
    )
  )
);

-- ============================================================================
-- POLICY: qr_codes_select_authorized
-- Allow users to read QR codes if they are:
-- 1. The seller who created the ask (can always see their own ask QRs)
-- 2. The winner of a ticket (can see ticket QRs)
-- ============================================================================
CREATE POLICY qr_codes_select_authorized
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'qr_codes'
  AND
  (
    -- Rule 1: User is the seller of the ask
    EXISTS (
      SELECT 1
      FROM public.asks
      WHERE asks.id::text = split_part(name, '/', 2)
        AND asks.seller_id = auth.uid()
    )
    OR
    -- Rule 2: User is the winner of a ticket
    -- Tickets reference matches, which reference asks
    -- Path for tickets: {event_id}/{ticket_id}/qr.png
    EXISTS (
      SELECT 1
      FROM public.tickets
      WHERE tickets.id::text = split_part(name, '/', 2)
        AND tickets.winner_id = auth.uid()
    )
  )
);

-- ============================================================================
-- POLICY: Updates are denied by default
-- No UPDATE policy is created, which means all updates are denied for qr_codes
-- This makes QR codes immutable once uploaded
-- ============================================================================

-- ============================================================================
-- POLICY: qr_codes_delete_seller
-- Allow sellers to delete QR codes for their asks, but only if status = 'open'
-- Once an ask is matched, the QR should not be deletable
-- ============================================================================
CREATE POLICY qr_codes_delete_seller
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'qr_codes'
  AND
  EXISTS (
    SELECT 1
    FROM public.asks
    WHERE asks.id::text = split_part(name, '/', 2)
      AND asks.seller_id = auth.uid()
      AND asks.status = 'open'  -- Only allow deletion of open asks
  )
);

-- ============================================================================
-- Documentation is in the comments above each policy
-- Cannot add COMMENT ON POLICY as we don't own the storage.objects table
-- ============================================================================
