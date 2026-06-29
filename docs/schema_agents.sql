-- SQL schema changes for Background Agents

-- Create trust_scores historical log table
CREATE TABLE IF NOT EXISTS public.trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
    band TEXT NOT NULL CHECK (band IN ('Building', 'Growing', 'Good', 'Trusted')),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_logs error tracking table
CREATE TABLE IF NOT EXISTS public.agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create in-app notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own trust scores history"
ON public.trust_scores FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Users can mark notifications as read"
ON public.notifications FOR UPDATE
USING (auth.uid() = profile_id);

-- System admin insertion policies
CREATE POLICY "Allow service role insertion on trust_scores"
ON public.trust_scores FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "Allow service role insertion on notifications"
ON public.notifications FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "Allow service role insertion on agent_logs"
ON public.agent_logs FOR INSERT
WITH CHECK (TRUE);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS trust_scores_profile_id_idx ON public.trust_scores(profile_id);
CREATE INDEX IF NOT EXISTS notifications_profile_id_idx ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
