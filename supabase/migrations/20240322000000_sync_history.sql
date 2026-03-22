-- Create sync_history table to track automated and manual sync tasks
CREATE TABLE IF NOT EXISTS public.sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    trades_count INTEGER DEFAULT 0,
    fund_flows_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    is_automated BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sync history" ON public.sync_history
    FOR SELECT USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sync_history_user_exchange ON public.sync_history(user_id, exchange);
CREATE INDEX IF NOT EXISTS idx_sync_history_started_at ON public.sync_history(started_at DESC);
