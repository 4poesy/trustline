'use client'

import { useEffect } from 'react'
import { initDB } from '@/lib/offline/db'
import { registerSyncTriggers } from '@/lib/offline/syncManager'

interface Props {
  children: React.ReactNode
}

/**
 * Client provider bootstrapper that runs on app mount to:
 * 1. Initialize the IndexedDB database.
 * 2. Attach background visibility and online sync triggers.
 * 3. Register the app Service Worker.
 */
export function PwaProvider({ children }: Props) {
  useEffect(() => {
    // Initialize IndexedDB
    initDB()

    // Attach network and visibility sync listeners
    registerSyncTriggers()

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered scope:', reg.scope)
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err)
          })
      })
    }

    // Show non-intrusive notification when sync finishes in background
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && detail.count) {
        console.log(`[PWA] Non-intrusive sync alert: ${detail.count} records synced.`)
      }
    }

    window.addEventListener('trustline-sync-complete', onSync)
    return () => {
      window.removeEventListener('trustline-sync-complete', onSync)
    }
  }, [])

  return <>{children}</>
}
