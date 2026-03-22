-- Add 'pending' to the allowed statuses for sync_history
ALTER TABLE public.sync_history DROP CONSTRAINT IF EXISTS sync_history_status_check;
ALTER TABLE public.sync_history ADD CONSTRAINT sync_history_status_check CHECK (status IN ('pending', 'success', 'partial', 'failed'));
