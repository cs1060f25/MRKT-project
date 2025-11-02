-- ============================================================================
-- Fix rpc_mark_ticket_delivered security model
-- ============================================================================
-- Change to SECURITY DEFINER so function can read ticket data for authorization
-- check, but still manually enforce who can deliver tickets.

CREATE OR REPLACE FUNCTION public.rpc_mark_ticket_delivered(ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Changed from INVOKER to DEFINER to bypass RLS for auth check
SET search_path = public
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
  IF auth.uid() = v_winner_id OR auth.uid() = v_seller_id THEN
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
