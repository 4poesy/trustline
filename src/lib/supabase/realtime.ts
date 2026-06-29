import { supabase } from './client'

/**
 * Subscribes to realtime insertions of contributions for an Ajo group.
 */
export function subscribeToGroupPayments(groupId: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel(`group-${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        table: 'contributions',
        filter: `group_id=eq.${groupId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Subscribes to realtime customer reviews for a user profile.
 * Automatically triggers callback and inserts an in-app notification.
 */
export function subscribeToReviews(profileId: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel(`reviews-${profileId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        table: 'reviews',
        filter: `reviewed_profile_id=eq.${profileId}`,
      },
      async (payload) => {
        callback(payload)

        // Write in-app notification to table
        const newReview = payload.new
        const rating = newReview.rating || 5
        const comment = newReview.comment || 'No comment'

        try {
          await supabase.from('notifications').insert({
            profile_id: profileId,
            title: 'New Review Received! ⭐️',
            body: `You received a new ${rating}-star rating: "${comment}"`,
          })
        } catch (err) {
          console.warn('[Realtime] Notification auto-insert failed:', err)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Closes all active realtime database subscriptions.
 */
export async function unsubscribeAll() {
  await supabase.removeAllChannels()
}
