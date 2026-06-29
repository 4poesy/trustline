import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getListing } from '@/lib/supabase/listings'
import { getReviews } from '@/lib/supabase/reviews'
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
  const { data: listing } = await getListing(slug)

  if (!listing) return {}

  return {
    title: `${listing.display_name} — Verified ${listing.category} in ${listing.location} | Trustline`,
    description: listing.bio || `Check out reviews, ratings, and transaction history for ${listing.display_name} on Trustline.`,
  }
}

export default async function ProfileDetailPage({ params }: Props) {
  const { slug } = await params

  // Fetch listing details
  const { data: listing } = await getListing(slug)

  if (!listing) {
    notFound()
  }

  // Fetch reviews
  const { data: reviewData } = await getReviews(listing.profile_id, { page: 1, limit: 50 })
  const reviews = reviewData?.reviews || []

  return (
    <ProfileClient listing={listing} initialReviews={reviews || []} />
  )
}
