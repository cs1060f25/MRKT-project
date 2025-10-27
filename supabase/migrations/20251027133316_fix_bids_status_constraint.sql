-- Add CHECK constraint to bids.status field
-- Valid values: 'open', 'matched'
ALTER TABLE public.bids
ADD CONSTRAINT bids_status_check
CHECK (status IN ('open', 'matched'));
