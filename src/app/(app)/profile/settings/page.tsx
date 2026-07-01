'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Download, Shield, Eye, EyeOff, Save, Trash2, Key, Check } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PinPad } from '@/modules/auth/components/PinPad'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

export default function ProfileSettingsPage() {
  const { profile, signOut } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  // General Settings State
  const [name, setName] = useState(profile?.name || '')
  const [businessType, setBusinessType] = useState(profile?.business_type || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [publicUsername, setPublicUsername] = useState(profile?.public_username || '')

  // PIN Change State
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [showPinChange, setShowPinChange] = useState(false)

  // Account Deletion State
  const [deleteConfirmPin, setDeleteConfirmPin] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Status State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  if (!profile) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading settings...</p>
      </div>
    )
  }

  // Handle profile details update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters.')
      }

      if (publicUsername && !/^[a-z0-9._]+$/.test(publicUsername)) {
        throw new Error('Username must be lowercase alphanumeric, dots, or underscores.')
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          business_type: businessType.trim(),
          location: location.trim(),
          public_username: publicUsername.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateErr) throw updateErr

      setSuccess('Profile updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  // Handle PIN change
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data, error: pinErr } = await supabase.functions.invoke('change-pin', {
        body: { current_pin: currentPin, new_pin: newPin }
      })

      if (pinErr || data?.error) {
        throw new Error(pinErr?.message || data?.error || 'PIN change failed.')
      }

      setSuccess('PIN changed successfully. Other sessions invalidated.')
      setCurrentPin('')
      setNewPin('')
      setShowPinChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to change PIN.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // 1. Verify PIN by attempting a login check
      const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('verify-trustline-login', {
        body: { trustline_code: profile.trustline_code, pin: deleteConfirmPin }
      })

      if (verifyErr || !verifyData?.success) {
        throw new Error('Incorrect PIN. Authentication failed.')
      }

      // 2. Delete the profile (cascade deletes transactions/savings/loans)
      const { error: deleteErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id)

      if (deleteErr) throw deleteErr

      // 3. Log out and go home
      await signOut()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Account deletion failed.')
    } finally {
      setLoading(false)
    }
  }

  // Copy code helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.trustline_code)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // Download code as photo helper (canvas draw)
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0A2E1F'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#E8A020'
    ctx.lineWidth = 10
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    ctx.fillStyle = '#E8A020'
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText('TRUSTLINE365', 50, 70)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '20px sans-serif'
    ctx.fillText('Permanent Access Pass', 50, 110)

    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(50, 160, canvas.width - 100, 100)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(profile.trustline_code, canvas.width / 2, 225)

    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = 'italic 14px sans-serif'
    ctx.fillText('Keep this code secure. Do not share it with anyone.', 50, 310)
    ctx.fillText('It is the only way to log back into your Trustline365 account.', 50, 335)

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `trustline-code-${profile.trustline_code}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.title}>Account Settings</h1>
        <div style={{ width: 24 }} />
      </header>

      <main className={styles.main}>
        {error && <div className={styles.errorBox}>{error}</div>}
        {success && <div className={styles.successBox}>{success}</div>}

        {/* 1. Trustline Code Access Pass */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Access Pass</h2>
          <div className={styles.certificate}>
            <Shield className={styles.certIcon} size={32} />
            <span className={styles.certBrand}>TRUSTLINE365</span>
            <div className={styles.codeDisplay}>{profile.trustline_code}</div>
            
            <div className={styles.actions}>
              <button onClick={handleCopyCode} className={styles.actionBtn}>
                <Copy size={16} /> {copySuccess ? 'Copied!' : 'Copy Code'}
              </button>
              <button onClick={handleDownloadImage} className={styles.actionBtn}>
                <Download size={16} /> Save photo
              </button>
            </div>
          </div>
        </section>

        {/* 2. Profile Details */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Personal Details</h2>
          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullname">Full Name</label>
              <input
                id="fullname"
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="business">Business Type</label>
              <input
                id="business"
                type="text"
                className="form-input"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="location">Operating Location</label>
              <input
                id="location"
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="username">Public @Username</label>
              <input
                id="username"
                type="text"
                className="form-input"
                value={publicUsername}
                placeholder="username"
                onChange={(e) => setPublicUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} style={{ marginRight: '6px' }} /> Save Profile
            </button>
          </form>
        </section>

        {/* 3. Security Settings (PIN Change) */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Security</h2>
          {!showPinChange ? (
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setShowPinChange(true)}
            >
              <Key size={16} style={{ marginRight: '6px' }} /> Change Security PIN
            </button>
          ) : (
            <form onSubmit={handleChangePin} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="curpin">Current 4-Digit PIN</label>
                <input
                  id="curpin"
                  type="password"
                  maxLength={4}
                  required
                  className="form-input"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newpin">New 4-Digit PIN</label>
                <input
                  id="newpin"
                  type="password"
                  maxLength={4}
                  required
                  className="form-input"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className={styles.btnRow}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPinChange(false)
                    setCurrentPin('')
                    setNewPin('')
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Change PIN
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 4. Danger Zone */}
        <section className={`${styles.section} ${styles.dangerSection}`}>
          <h2 className={styles.dangerTitle}>Danger Zone</h2>
          <p className={styles.dangerText}>
            Deleting your account will permanently wipe out your entire transaction diary, ajo savings, 
            matched loan histories, and directory listing. This action is irreversible.
          </p>

          {!showDeleteConfirm ? (
            <button 
              type="button" 
              className={styles.deleteBtn}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} style={{ marginRight: '6px' }} /> Delete My Account
            </button>
          ) : (
            <div className={styles.deleteConfirmBox}>
              <p className={styles.deleteWarnLabel}>Enter your 4-digit PIN to confirm deletion:</p>
              <input
                type="password"
                maxLength={4}
                required
                className="form-input"
                placeholder="4-digit PIN"
                value={deleteConfirmPin}
                onChange={(e) => setDeleteConfirmPin(e.target.value.replace(/\D/g, ''))}
                style={{ width: '120px', textAlign: 'center', margin: '12px auto' }}
              />
              
              <div className={styles.btnRow}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmPin('')
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={styles.finalDeleteBtn}
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmPin.length < 4 || loading}
                >
                  Confirm Permanent Delete
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
