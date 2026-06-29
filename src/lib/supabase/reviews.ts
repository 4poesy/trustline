import { supabase } from './client'

export interface Review {
  id?: string
  reviewed_profile_id: string
  reviewer_profile_id?: string
  rating: number
  comment?: string
  verified_transaction?: boolean
  created_at?: string
}

/**
 * Returns reviews list along with aggregate ratings calculations.
 */
export async function getReviews(profileId: string, options: { page: number; limit: number }) {
  const from = (options.page - 1) * options.limit
  const to = from + options.limit - 1

  const { data: reviews, error, count } = await supabase
    .from('reviews')
    .select('*, profiles:reviewer_profile_id(name)', { count: 'exact' })
    .eq('reviewed_profile_id', profileId)
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data: allRatings, error: rError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_profile_id', profileId)

  let avgRating = 0
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>

  if (allRatings && allRatings.length > 0) {
    const total = allRatings.length
    avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / total
    allRatings.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        breakdown[r.rating]++
      }
    })
  }

  return {
    data: {
      reviews,
      total_count: count || 0,
      avg_rating: Number(avgRating.toFixed(2)),
      breakdown,
    },
    error: error || rError,
  }
}

/**
 * Submits a new customer review. Validates that reviewer is not the vendor.
 */
export async function addReview(data: Review) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: new Error('Authentication is required to leave a review.') }
  }

  if (data.reviewed_profile_id === user.id) {
    return { data: null, error: new Error('You cannot write a review for your own profile.') }
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      reviewed_profile_id: data.reviewed_profile_id,
      reviewer_profile_id: user.id,
      rating: data.rating,
      comment: data.comment,
      verified_transaction: data.verified_transaction || false,
    })
    .select()
    .single()

  return { data: review, error }
}

/**
 * Returns a lightweight rating aggregate block for listing cards.
 */
export async function getReviewsForDirectory(profileId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_profile_id', profileId)

  let avgRating = 0
  let totalCount = 0

  if (data && data.length > 0) {
    totalCount = data.length
    avgRating = data.reduce((sum, r) => sum + r.rating, 0) / totalCount
  }

  return {
    data: {
      avg_rating: Number(avgRating.toFixed(2)),
      total_count: totalCount,
    },
    error,
  }
}
