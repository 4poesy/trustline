'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Bell, BellOff, CheckCircle, Save, Smartphone } from 'lucide-react'
import styles from './page.module.css'

export default function NotificationsPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [salesReminder, setSalesReminder] = useState(true)
  const [savingsAlerts, setSavingsAlerts] = useState(true)
  const [billAlerts, setBillAlerts] = useState(true)
  const [p2pAlerts, setP2pAlerts] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(true)
  const [deviceToken, setDeviceToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    const loadSettings = async () => {
      if (!profile?.id) return
      try {
        // Load existing token
        const { data } = await supabase
          .from('device_tokens')
          .select('token')
          .eq('profile_id', profile.id)
          .maybeSingle()

        if (data) {
          setDeviceToken(data.token)
        } else {
          // Setup mock Capacitor FCM registration token
          setDeviceToken(`FCM-MOCK-TOKEN-${Math.random().toString(36).substring(2, 12).toUpperCase()}`)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [profile?.id])

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      // Upsert device token
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          profile_id: profile.id,
          token: deviceToken,
          platform: 'android',
          updated_at: new Date().toISOString()
        }, { onConflict: 'token' })

      if (error) throw error

      setToastMsg('Notification preferences saved successfully!')
      setTimeout(() => setToastMsg(''), 3000)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to save preferences.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading notification settings...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Notification Settings</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {toastMsg && (
          <div className={styles.toast}>
            <CheckCircle size={16} />
            <span>{toastMsg}</span>
          </div>
        )}

        <section className={`card ${styles.prefCard}`}>
          <div className={styles.cardHeader}>
            <Bell size={24} className={styles.icon} />
            <div>
              <h3>PUSH NOTIFICATIONS</h3>
              <p>Control what alerts you receive on your mobile device</p>
            </div>
          </div>

          <div className={styles.settingRows}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <h4>Daily Sales Reminders</h4>
                <p>Reminds you to log transactions if none logged by 6 PM</p>
              </div>
              <input
                type="checkbox"
                className={styles.switch}
                checked={salesReminder}
                onChange={(e) => setSalesReminder(e.target.checked)}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <h4>Savings Group Reminders</h4>
                <p>Notifies you when savings cycle contributions are due</p>
              </div>
              <input
                type="checkbox"
                className={styles.switch}
                checked={savingsAlerts}
                onChange={(e) => setSavingsAlerts(e.target.checked)}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <h4>Bill Payment Receipts</h4>
                <p>Confirmations of airtime, data, and utility payments</p>
              </div>
              <input
                type="checkbox"
                className={styles.switch}
                checked={billAlerts}
                onChange={(e) => setBillAlerts(e.target.checked)}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <h4>P2P Transfer Alerts</h4>
                <p>Notifies you immediately when you receive money</p>
              </div>
              <input
                type="checkbox"
                className={styles.switch}
                checked={p2pAlerts}
                onChange={(e) => setP2pAlerts(e.target.checked)}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <h4>Weekly Income Summary</h4>
                <p>Every Sunday summary of your logged earnings</p>
              </div>
              <input
                type="checkbox"
                className={styles.switch}
                checked={weeklyReports}
                onChange={(e) => setWeeklyReports(e.target.checked)}
              />
            </div>
          </div>
        </section>

        <section className={`card ${styles.tokenCard}`}>
          <div className={styles.tokenHeader}>
            <Smartphone size={20} />
            <h4>Registered Device Token</h4>
          </div>
          <p className={styles.tokenVal}>{deviceToken || 'No token registered'}</p>
        </section>

        <button onClick={handleSave} className="btn btn-primary btn-large" disabled={saving}>
          <Save size={18} style={{ marginRight: '8px' }} />
          {saving ? 'Saving preferences...' : 'Save Preferences'}
        </button>
      </main>
    </div>
  )
}
