import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from './ProfileClient'

interface Props {
  params: Promise<{
    location: string
    category: string
    slug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: listing } = await supabase
    .from('listings')
    .select('display_name, category, location, bio')
    .eq('slug', slug)
    .single()

  if (!listing) return {}

  return {
    title: `${listing.display_name} — Verified ${listing.category} in ${listing.location} | Trustline`,
    description: listing.bio || `Check out reviews, ratings, and transaction history for ${listing.display_name} on Trustline.`,
  }
}

export default async function ProfileDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch listing details
  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles(id, name, phone_number)')
    .eq('slug', slug)
    .single()

  if (!listing) {
    notFound()
  }

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewed_profile_id', listing.profile_id)
    .order('created_at', { ascending: false })

  return (
    <ProfileClient listing={listing} initialReviews={reviews || []} />
  )
}
