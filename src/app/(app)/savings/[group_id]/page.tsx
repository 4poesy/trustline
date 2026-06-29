'use client'

import { use } from 'react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { GroupDetailClient } from './GroupDetailClient'
import styles from './page.module.css'

interface Props {
  params: Promise<{
    group_id: string
  }>
}

export default function SavingsGroupDetailPage({ params }: Props) {
  const { group_id } = use(params)
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading group details...</p>
      </div>
    )
  }

  if (!profile) return null

  return <GroupDetailClient profile={profile} groupId={group_id} />
}
