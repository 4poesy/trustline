import { supabase } from './client'

export interface Listing {
  id?: string
  profile_id: string
  slug: string
  display_name: string
  category?: string
  location?: string
  bio?: string
  is_public?: boolean
  created_at?: string
}

/**
 * Returns a full listing page item by slug with reviews aggregated. (SEO critical).
 */
export async function getListing(slug: string) {
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('slug', slug)
    .single()

  if (error || !listing) {
    return { data: null, error }
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_profile_id', listing.profile_id)

  let avgRating = 0
  let totalCount = 0
  if (reviews && reviews.length > 0) {
    totalCount = reviews.length
    avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
  }

  return {
    data: {
      ...listing,
      avg_rating: Number(avgRating.toFixed(2)),
      total_reviews: totalCount,
    },
    error: null,
  }
}

/**
 * Executes a paginated full-text ILIKE search over public listings.
 */
export async function searchListings(params: {
  category?: string
  location?: string
  query?: string
  page?: number
  limit?: number
}) {
  const page = params.page || 1
  const limit = params.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('listings')
    .select('*, profiles(*)', { count: 'exact' })
    .eq('is_public', true)

  if (params.category) {
    query = query.eq('category', params.category)
  }
  if (params.location) {
    query = query.eq('location', params.location)
  }

  if (params.query) {
    const searchVal = `%${params.query}%`
    query = query.or(
      `display_name.ilike.${searchVal},bio.ilike.${searchVal},category.ilike.${searchVal},location.ilike.${searchVal}`
    )
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const results = []
  if (data) {
    for (const listing of data) {
      const { data: revStats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_profile_id', listing.profile_id)

      let avgRating = 0
      let totalCount = 0
      if (revStats && revStats.length > 0) {
        totalCount = revStats.length
        avgRating = revStats.reduce((sum, r) => sum + r.rating, 0) / totalCount
      }

      results.push({
        ...listing,
        avg_rating: Number(avgRating.toFixed(2)),
        total_reviews: totalCount,
      })
    }
  }

  return {
    data: results,
    total_count: count || 0,
    error,
  }
}

/**
 * Updates public business listing configurations.
 */
export async function updateListing(profileId: string, data: Partial<Listing>) {
  const { data: listing, error } = await supabase
    .from('listings')
    .update(data)
    .eq('profile_id', profileId)
    .select()
    .single()
  return { data: listing, error }
}

/**
 * Toggles directory visibility status.
 */
export async function togglePublic(profileId: string, isPublic: boolean) {
  const { data: listing, error } = await supabase
    .from('listings')
    .update({ is_public: isPublic })
    .eq('profile_id', profileId)
    .select()
    .single()
  return { data: listing, error }
}
