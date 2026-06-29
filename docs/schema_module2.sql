-- SQL schema changes for Module 2: Cashflow Tracker

-- Create the transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL,
    note TEXT,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Users can insert their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = profile_id);

-- Note: We do NOT create UPDATE or DELETE policies since transactions are insert-only!

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS transactions_profile_id_idx ON public.transactions(profile_id);
CREATE INDEX IF NOT EXISTS transactions_entry_date_idx ON public.transactions(entry_date);
CREATE INDEX IF NOT EXISTS transactions_synced_at_idx ON public.transactions(synced_at) WHERE synced_at IS NULL;
