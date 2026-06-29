-- ==========================================
-- TRUSTLINE SCHEMA SETUP (COMBINED)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create profiles table (Module 1)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK (role IN ('trader', 'service_provider', 'group_member')),
    business_type TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Select policy: profiles are public (needed for directory in Module 3)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Insert/Update policies: users manage their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS profiles_phone_number_idx ON public.profiles(phone_number);


-- 2. Create transactions table (Module 2)
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

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Insert/Select policies: users own their transaction records
CREATE POLICY "Users can insert their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = profile_id);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS transactions_profile_id_idx ON public.transactions(profile_id);
CREATE INDEX IF NOT EXISTS transactions_entry_date_idx ON public.transactions(entry_date);
CREATE INDEX IF NOT EXISTS transactions_synced_at_idx ON public.transactions(synced_at) WHERE synced_at IS NULL;
