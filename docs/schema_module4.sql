-- SQL schema changes for Module 4: Credit & Savings

-- Create savings_groups table
CREATE TABLE IF NOT EXISTS public.savings_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contribution_amount NUMERIC NOT NULL CHECK (contribution_amount >= 0),
    cycle_frequency TEXT NOT NULL CHECK (cycle_frequency IN ('weekly', 'monthly')),
    payout_order JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_cycle INTEGER NOT NULL DEFAULT 1,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.savings_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, profile_id)
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.savings_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    cycle_number INTEGER NOT NULL CHECK (cycle_number >= 1),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- Create trust_metrics cache table
CREATE TABLE IF NOT EXISTS public.trust_metrics (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    income_consistency_score NUMERIC NOT NULL DEFAULT 0 CHECK (income_consistency_score >= 0 AND income_consistency_score <= 100),
    savings_discipline_score NUMERIC NOT NULL DEFAULT 0 CHECK (savings_discipline_score >= 0 AND savings_discipline_score <= 100),
    reputation_score NUMERIC NOT NULL DEFAULT 0 CHECK (reputation_score >= 0 AND reputation_score <= 5),
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.savings_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for savings_groups
CREATE POLICY "Users can create savings groups" 
ON public.savings_groups 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_profile_id);

CREATE POLICY "Members can view savings groups" 
ON public.savings_groups 
FOR SELECT 
USING (
    auth.uid() = created_by_profile_id OR 
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_members.group_id = id AND group_members.profile_id = auth.uid()
    )
);

-- Policies for group_members
CREATE POLICY "Users can join groups with invite" 
ON public.group_members 
FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Members can view group members list" 
ON public.group_members 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.savings_groups 
        WHERE savings_groups.id = group_id AND (
            savings_groups.created_by_profile_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.group_members gm 
                WHERE gm.group_id = group_id AND gm.profile_id = auth.uid()
            )
        )
    )
);

-- Policies for contributions
CREATE POLICY "Members can view group contributions" 
ON public.contributions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_members.group_id = contributions.group_id AND group_members.profile_id = auth.uid()
    )
);

CREATE POLICY "Members can log contributions" 
ON public.contributions 
FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- Policies for trust_metrics
CREATE POLICY "Users can view their own trust metrics" 
ON public.trust_metrics 
FOR SELECT 
USING (auth.uid() = profile_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_profile_id_idx ON public.group_members(profile_id);
CREATE INDEX IF NOT EXISTS contributions_group_id_idx ON public.contributions(group_id);
CREATE INDEX IF NOT EXISTS contributions_profile_id_idx ON public.contributions(profile_id);
CREATE INDEX IF NOT EXISTS savings_groups_invite_code_idx ON public.savings_groups(invite_code);
