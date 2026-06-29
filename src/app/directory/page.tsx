import type { Metadata } from 'next'
import { searchListings } from '@/lib/supabase/listings'
import { DirectoryClient } from './DirectoryClient'

export const metadata: Metadata = {
  title: 'Find Trusted Traders & Service Providers — Trustline Directory',
  description: 'Search our directory of verified tailors, mechanics, traders, and service providers in Nigeria. View reviews and check reputation scores.',
  openGraph: {
    title: 'Verify & Find Trusted Service Providers — Trustline',
    description: 'Browse verified profiles and check reviews of informal economy traders and service providers in Nigeria.',
    type: 'website',
  },
}

export default async function DirectoryPage() {
  const { data: listings } = await searchListings({ page: 1, limit: 100 })

  return (
    <DirectoryClient initialListings={listings || []} />
  )
}
