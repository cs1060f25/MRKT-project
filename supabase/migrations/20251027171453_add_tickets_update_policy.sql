-- ============================================================================
-- Add UPDATE policy for tickets table
-- ============================================================================
-- Allows winner or seller to mark tickets as delivered via rpc_mark_ticket_delivered

CREATE POLICY "tickets_update_winner_or_seller"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    winner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM public.matches
      JOIN public.asks ON matches.ask_id = asks.id
      WHERE tickets.match_id = matches.id
      AND asks.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    winner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM public.matches
      JOIN public.asks ON matches.ask_id = asks.id
      WHERE tickets.match_id = matches.id
      AND asks.seller_id = auth.uid()
    )
  );
