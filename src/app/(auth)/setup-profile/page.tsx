'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RoleCard } from '@/modules/auth/components/RoleCard'
import styles from './page.module.css'

type UserRole = 'trader' | 'service_provider' | 'group_member'

export default function SetupProfilePage() {
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole | null>(null)
  const [businessType, setBusinessType] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const isValid = name.trim().length >= 2 && role !== null && location.trim().length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !role) return

    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          phone_number: user.phone || '',
          name: name.trim(),
          role,
          business_type: businessType.trim(),
          location: location.trim(),
        })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      router.replace('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.stepBadge}>Almost there!</div>
          <h1 className={styles.title}>Set up your profile</h1>
          <p className={styles.subtitle}>Tell us a bit about yourself so we can personalise your experience</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label htmlFor="name-input" className="form-label">Your name</label>
            <input
              id="name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Adebayo Ogunlesi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">What best describes you?</label>
            <div className={styles.roleGrid} role="radiogroup" aria-label="Select your role">
              <RoleCard
                role="trader"
                title="Trader"
                description="I buy and sell goods"
                selected={role === 'trader'}
                onSelect={() => setRole('trader')}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                }
              />
              <RoleCard
                role="service_provider"
                title="Service Provider"
                description="I offer services like tailoring, repairs, etc."
                selected={role === 'service_provider'}
                onSelect={() => setRole('service_provider')}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                }
              />
              <RoleCard
                role="group_member"
                title="Savings Group Member"
                description="I save with a group (ajo, esusu, etc.)"
                selected={role === 'group_member'}
                onSelect={() => setRole('group_member')}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
              />
            </div>
          </div>

          {role !== 'group_member' && (
            <div className="form-group">
              <label htmlFor="business-type-input" className="form-label">Type of business</label>
              <input
                id="business-type-input"
                type="text"
                className="form-input"
                placeholder="e.g. Tailoring, Electronics repair, Market trading"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />
              <span className="form-hint">Helps customers find you in the directory</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="location-input" className="form-label">Location</label>
            <input
              id="location-input"
              type="text"
              className="form-input"
              placeholder="e.g. Lagos, Ikeja"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={!isValid || loading}
            id="get-started-button"
          >
            {loading ? (
              <>
                <span className="spinner spinner-white" />
                Setting up...
              </>
            ) : (
              'Get Started'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
