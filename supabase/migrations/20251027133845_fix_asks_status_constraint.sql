-- Add CHECK constraint to asks.status field
-- Valid values: 'open', 'matched', 'delivered'
ALTER TABLE public.asks
ADD CONSTRAINT asks_status_check
CHECK (status IN ('open', 'matched', 'delivered'));
