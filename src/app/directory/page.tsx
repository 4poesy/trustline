import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  // Fetch public listings from Supabase
  const { data: listings } = await supabase
    .from('listings')
    .select('*, profiles(name, phone_number, business_type)')
    .eq('is_public', true)

  return (
    <DirectoryClient initialListings={listings || []} />
  )
}
