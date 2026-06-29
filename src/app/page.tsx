import type { Metadata } from 'next'
import { LandingPageClient } from '@/modules/landing/components/LandingPageClient'

export const metadata: Metadata = {
  title: 'Trustline — Build Credit, Track Income, Save Together',
  description: 'Trustline helps traders, vendors, and service providers track income, build verifiable credit history, and save together in rotating savings groups. No bank account needed.',
  openGraph: {
    title: 'Trustline — Build Credit, Track Income, Save Together',
    description: 'Track your daily income, build a verifiable financial record, and access savings groups — all from your phone. Made for African traders and entrepreneurs.',
    type: 'website',
    locale: 'en_NG',
    siteName: 'Trustline',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trustline — Build Credit, Track Income, Save Together',
    description: 'Track your daily income, build a verifiable financial record, and access savings groups — all from your phone.',
  },
}

export default function LandingPage() {
  return <LandingPageClient />
}
