'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupProfilePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return null
}
