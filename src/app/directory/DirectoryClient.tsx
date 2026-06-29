'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

interface ListingWithProfile {
  id: string
  profile_id: string
  slug: string
  display_name: string
  category: string
  location: string
  bio?: string | null
  profiles?: {
    name: string | null
    phone_number: string | null
    business_type: string | null
  } | null
}

interface Props {
  initialListings: ListingWithProfile[]
}

const nicheSuggestions = [
  'Tailoring',
  'Market Trading',
  'Electronics Repair',
  'Hairdressing',
  'Catering',
  'Plumbing',
  'Carpentry',
  'Laundry Service'
]

const citySuggestions = [
  'Lagos, Ikeja',
  'Lagos, Lekki',
  'Lagos, Yaba',
  'Lagos, Surulere',
  'Abuja, Garki',
  'Port Harcourt',
  'Ibadan',
  'Kano'
]

export function DirectoryClient({ initialListings }: Props) {
  const [nicheInput, setNicheInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [showNicheDropdown, setShowNicheDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  const nicheRef = useRef<HTMLDivElement>(null)
  const locationRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nicheRef.current && !nicheRef.current.contains(event.target as Node)) {
        setShowNicheDropdown(false)
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter listings locally based on inputs
  const filteredListings = initialListings.filter((listing) => {
    const matchNiche = nicheInput === '' || 
      listing.category.toLowerCase().includes(nicheInput.toLowerCase()) ||
      (listing.profiles?.business_type || '').toLowerCase().includes(nicheInput.toLowerCase())
    
    const matchLocation = locationInput === '' || 
      listing.location.toLowerCase().includes(locationInput.toLowerCase())

    return matchNiche && matchLocation
  })

  // Format dynamic paths for directory profile pages
  const buildProfilePath = (location: string, category: string, slug: string) => {
    const cleanLocation = location.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const cleanCategory = category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `/directory/${cleanLocation}/${cleanCategory}/${slug}`
  }

  return (
    <div className={styles.page}>
      {/* Navigation Header */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <Link href="/" className={styles.logo}>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoIcon}>
              <rect width="40" height="40" rx="10" fill="#0D7C66" />
              <path d="M12 28L16 14L20 22L24 16L28 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="28" cy="24" r="2" fill="#D4A24E" />
            </svg>
            <span className={styles.logoText}>Trustline</span>
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Sign In
          </Link>
        </div>
      </nav>

      <main className={`container ${styles.main}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Find Trusted Business Partners</h1>
          <p className={styles.subtitle}>Check reviews and verify income history of local service providers and traders</p>
        </header>

        {/* Search Panel with Overlay Dropdowns */}
        <section className={styles.searchBar}>
          {/* Niche Search Wrapper */}
          <div className={styles.inputWrapper} ref={nicheRef}>
            <label htmlFor="niche-search" className={styles.inputLabel}>What service do you need?</label>
            <div className={styles.inputContainer}>
              <span className={styles.inputIcon}>🔍</span>
              <input
                id="niche-search"
                type="text"
                className={`form-input ${styles.input}`}
                placeholder="e.g. Tailoring, Electrician..."
                value={nicheInput}
                onChange={(e) => {
                  setNicheInput(e.target.value)
                  setShowNicheDropdown(true)
                }}
                onFocus={() => {
                  setShowNicheDropdown(true)
                  setShowLocationDropdown(false)
                }}
              />
            </div>
            {/* Dynamic high-contrast pill dropdown */}
            <div className={`${styles.dropdown} ${showNicheDropdown ? styles.dropdownOpen : ''}`}>
              <p className={styles.dropdownTitle}>Popular Services</p>
              <div className={styles.pillGrid}>
                {nicheSuggestions.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    className={styles.pill}
                    onClick={() => {
                      setNicheInput(niche)
                      setShowNicheDropdown(false)
                    }}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Search Wrapper */}
          <div className={styles.inputWrapper} ref={locationRef}>
            <label htmlFor="location-search" className={styles.inputLabel}>Where?</label>
            <div className={styles.inputContainer}>
              <span className={styles.inputIcon}>📍</span>
              <input
                id="location-search"
                type="text"
                className={`form-input ${styles.input}`}
                placeholder="e.g. Lagos, Ikeja..."
                value={locationInput}
                onChange={(e) => {
                  setLocationInput(e.target.value)
                  setShowLocationDropdown(true)
                }}
                onFocus={() => {
                  setShowLocationDropdown(true)
                  setShowNicheDropdown(false)
                }}
              />
            </div>
            {/* Dynamic high-contrast pill dropdown */}
            <div className={`${styles.dropdown} ${showLocationDropdown ? styles.dropdownOpen : ''}`}>
              <p className={styles.dropdownTitle}>Popular Locations</p>
              <div className={styles.pillGrid}>
                {citySuggestions.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className={styles.pill}
                    onClick={() => {
                      setLocationInput(city)
                      setShowLocationDropdown(false)
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Filtered Directory Listings */}
        <section className={styles.listingsSection}>
          <h2 className={styles.sectionTitle}>
            {filteredListings.length === 0 ? 'No results found' : `Showing ${filteredListings.length} verified listings`}
          </h2>

          <div className={styles.listingsGrid}>
            {filteredListings.map((listing) => (
              <Link
                key={listing.id}
                href={buildProfilePath(listing.location, listing.category, listing.slug)}
                className={`card ${styles.card}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {listing.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={styles.businessName}>{listing.display_name}</h3>
                    <span className={styles.businessCategory}>{listing.category}</span>
                  </div>
                </div>
                
                {listing.bio && <p className={styles.businessBio}>{listing.bio}</p>}

                <div className={styles.cardFooter}>
                  <span className={styles.businessLocation}>
                    📍 {listing.location}
                  </span>
                  <span className={styles.businessLink}>
                    View Profile &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateTitle}>Try broadening your search criteria</p>
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => {
                  setNicheInput('')
                  setLocationInput('')
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
