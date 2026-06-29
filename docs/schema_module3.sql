-- SQL schema changes for Module 3: Trust & Directory

-- Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    bio TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewed_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewer_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    verified_transaction BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for listings
CREATE POLICY "Public listings are viewable by everyone" 
ON public.listings 
FOR SELECT 
USING (is_public = TRUE);

CREATE POLICY "Users can manage their own listing" 
ON public.listings 
USING (auth.uid() = profile_id);

-- Create policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews 
FOR SELECT 
USING (TRUE);

CREATE POLICY "Authenticated users can insert reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_profile_id OR reviewer_profile_id IS NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS listings_category_idx ON public.listings(category);
CREATE INDEX IF NOT EXISTS listings_location_idx ON public.listings(location);
CREATE INDEX IF NOT EXISTS listings_slug_idx ON public.listings(slug);
CREATE INDEX IF NOT EXISTS reviews_reviewed_profile_id_idx ON public.reviews(reviewed_profile_id);
