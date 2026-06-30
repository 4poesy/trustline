'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

interface ListingDetails {
  id: string
  profile_id: string
  slug: string
  display_name: string
  category: string
  location: string
  bio?: string | null
  profiles?: {
    id: string
    name: string | null
    phone_number: string | null
  } | null
}

interface ReviewDetails {
  id: string
  reviewed_profile_id: string
  reviewer_profile_id?: string | null
  rating: number
  comment?: string | null
  verified_transaction: boolean
  created_at: string
}

interface Props {
  listing: ListingDetails
  initialReviews: ReviewDetails[]
}

export function ProfileClient({ listing, initialReviews }: Props) {
  const [reviews, setReviews] = useState<ReviewDetails[]>(initialReviews)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fetch logged in user to check if they are the reviewer
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [supabase])

  // Calculate statistics
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
    : '0.0'

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setIsSubmitting(true)

    try {
      const { data: newReview, error } = await supabase
        .from('reviews')
        .insert({
          reviewed_profile_id: listing.profile_id,
          reviewer_profile_id: user?.id || null,
          rating,
          comment: comment.trim(),
          verified_transaction: false
        })
        .select()
        .single()

      if (error) {
        alert(error.message)
        setIsSubmitting(false)
        return
      }

      if (newReview) {
        setReviews([newReview, ...reviews])
        setComment('')
        setRating(5)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Schema.org LocalBusiness structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': listing.display_name,
    'description': listing.bio || `Verified ${listing.category} service provider in ${listing.location}.`,
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': listing.location,
    },
    'image': 'https://trustline.app/icons/icon-512x512.png',
    ...(totalReviews > 0 && {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': averageRating,
        'reviewCount': totalReviews,
      }
    })
  }

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <Link href="/directory" className={styles.logo}>
            <div className={styles.logoMark}>T</div>
            <span className={styles.logoText}>Trustline</span>
          </Link>
          <button className="btn btn-secondary" onClick={() => router.back()}>
            Back
          </button>
        </div>
      </nav>

      <main className={`container ${styles.main}`}>
        {/* Business Header card */}
        <section className={`card ${styles.profileHeader}`}>
          <div className={styles.avatarLarge}>
            {listing.display_name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.profileMeta}>
            <span className={styles.categoryBadge}>{listing.category}</span>
            <h1 className={styles.businessName}>{listing.display_name}</h1>
            <p className={styles.location}>📍 {listing.location}</p>
          </div>
          {listing.bio && <p className={styles.bio}>{listing.bio}</p>}
        </section>

        {/* Rating Overview */}
        <section className={styles.ratingOverview}>
          <div className={`card ${styles.overviewCard}`}>
            <span className={styles.overviewLabel}>Average Rating</span>
            <h3 className={styles.avgRating}>{averageRating} / 5.0</h3>
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={i < Math.round(Number(averageRating)) ? styles.starFilled : styles.starEmpty}
                >
                  ★
                </span>
              ))}
            </div>
            <span className={styles.reviewCount}>{totalReviews} reviews total</span>
          </div>
        </section>

        {/* Submit Review Form */}
        <section className={`card ${styles.reviewFormSection}`}>
          <h2 className={styles.sectionTitle}>Leave a Review</h2>
          <form onSubmit={handleSubmitReview} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <div className={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    className={`${styles.starBtn} ${rating >= stars ? styles.starBtnActive : ''}`}
                    onClick={() => setRating(stars)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="review-comment" className="form-label">Your Comment</label>
              <textarea
                id="review-comment"
                rows={4}
                className={`form-input ${styles.textarea}`}
                placeholder="Share your experience working with this business..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </section>

        {/* Review list */}
        <section className={styles.reviewsSection}>
          <h2 className={styles.sectionTitle}>Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className={styles.noReviews}>No reviews yet. Be the first to leave a review!</p>
          ) : (
            <div className={styles.reviewsList}>
              {reviews.map((rev) => (
                <div key={rev.id} className={`card ${styles.reviewCard}`}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewerName}>Customer Review</span>
                    <div className={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < rev.rating ? styles.starFilled : styles.starEmpty}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {rev.comment && <p className={styles.reviewComment}>{rev.comment}</p>}
                  <div className={styles.reviewFooter}>
                    <span className={styles.reviewDate}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                    {rev.verified_transaction && (
                      <span className={styles.verifiedBadge}>✓ Verified Transaction</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
