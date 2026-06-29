'use client'

import { useAuth } from '@/modules/auth/hooks/useAuth'
import { SavingsClient } from './SavingsClient'
import styles from './page.module.css'

export default function SavingsPage() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading savings groups...</p>
      </div>
    )
  }

  if (!profile) return null

  return <SavingsClient profile={profile} />
}
