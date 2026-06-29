import { supabase } from './client'

/**
 * Fetches a user profile by ID.
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

/**
 * Updates user profile details.
 */
export async function updateProfile(userId: string, data: any) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single()
  return { data: profile, error }
}

/**
 * Creates a profile and automatically triggers a directory listing with slug.
 */
export async function createProfile(profileData: any) {
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single()

  if (pError || !profile) {
    return { data: null, error: pError }
  }

  try {
    // Invoke the Deno Edge Function to get a unique slug
    const { data: slugData, error: fError } = await supabase.functions.invoke('generate-slug', {
      body: {
        display_name: profile.name || 'Vendor',
        location: profile.location || '',
        profile_id: profile.id
      }
    })

    const slug = slugData?.slug || `${profile.id}`

    // Insert public directory listing
    const { data: listing, error: lError } = await supabase
      .from('listings')
      .insert({
        profile_id: profile.id,
        slug,
        display_name: profile.name || 'Vendor',
        category: profile.business_type || '',
        location: profile.location || '',
        is_public: true
      })
      .select()
      .single()

    return { data: { profile, listing }, error: lError }
  } catch (err) {
    console.warn('[ProfileAPI] Listing auto-creation failed, returning profile only:', err)
    return { data: { profile, listing: null }, error: null }
  }
}

/**
 * Returns public details for directory display, including reviews stats.
 */
export async function getPublicProfile(slug: string) {
  const { data: listing, error: lError } = await supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('slug', slug)
    .single()

  if (lError || !listing) {
    return { data: null, error: lError }
  }

  // Collate aggregate reviews stats
  const { data: reviews, error: rError } = await supabase
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
      total_reviews: totalCount
    },
    error: rError
  }
}
