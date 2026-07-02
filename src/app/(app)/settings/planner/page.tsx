'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, DollarSign, CloudRain, Bell, ShieldCheck, HelpCircle } from 'lucide-react'
import { usePlanner } from '@/modules/planner/hooks/usePlanner'
import styles from './page.module.css'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function PlannerSettingsPage() {
  const router = useRouter()
  const { preferences, loading, updatePreferences } = usePlanner()

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Settings State
  const [wakeUpTime, setWakeUpTime] = useState('06:00')
  const [sleepTime, setSleepTime] = useState('22:00')
  const [morningBriefing, setMorningBriefing] = useState(true)
  const [eveningSummary, setEveningSummary] = useState(true)
  const [prayerTimes, setPrayerTimes] = useState(false)
  const [prayerLocation, setPrayerLocation] = useState('')
  const [dailyTarget, setDailyTarget] = useState('')
  const [weeklyMarketDays, setWeeklyMarketDays] = useState<string[]>([])
  const [weatherAlerts, setWeatherAlerts] = useState(false)
  const [locationForWeather, setLocationForWeather] = useState('')

  // Load preferences
  useEffect(() => {
    if (preferences) {
      setWakeUpTime(preferences.wake_up_time.substring(0, 5))
      setSleepTime(preferences.sleep_time.substring(0, 5))
      setMorningBriefing(preferences.morning_briefing_enabled)
      setEveningSummary(preferences.evening_summary_enabled)
      setPrayerTimes(preferences.prayer_times_enabled)
      setPrayerLocation(preferences.prayer_location || '')
      setDailyTarget(preferences.daily_income_target ? preferences.daily_income_target.toString() : '')
      setWeeklyMarketDays(preferences.weekly_market_days || [])
      setWeatherAlerts(preferences.weather_alerts_enabled)
      setLocationForWeather(preferences.location_for_weather || '')
    }
  }, [preferences])

  // Toggle market day
  const handleToggleMarketDay = (day: string) => {
    if (weeklyMarketDays.includes(day)) {
      setWeeklyMarketDays(weeklyMarketDays.filter(d => d !== day))
    } else {
      setWeeklyMarketDays([...weeklyMarketDays, day])
    }
  }

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await updatePreferences({
        wake_up_time: `${wakeUpTime}:00`,
        sleep_time: `${sleepTime}:00`,
        morning_briefing_enabled: morningBriefing,
        evening_summary_enabled: eveningSummary,
        prayer_times_enabled: prayerTimes,
        prayer_location: prayerLocation.trim() || null,
        daily_income_target: dailyTarget ? parseFloat(dailyTarget) : null,
        weekly_market_days: weeklyMarketDays,
        weather_alerts_enabled: weatherAlerts,
        location_for_weather: locationForWeather.trim() || null
      })

      if (res.error) throw new Error(res.error)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading preferences...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/planner" className={styles.backButton}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Planner Settings</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSave} className={styles.form}>
          
          {success && (
            <div className={styles.successAlert}>
              <ShieldCheck size={18} />
              <span>Settings saved successfully!</span>
            </div>
          )}

          {error && (
            <div className={styles.errorAlert}>
              <span>{error}</span>
            </div>
          )}

          {/* Section: Daily Rhythm */}
          <section className={`card ${styles.section}`}>
            <h3 className={styles.sectionHeader}>
              <Clock size={16} /> Daily Rhythm
            </h3>
            
            <div className={styles.row}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Wake Up Time</label>
                <input 
                  type="time" 
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Sleep Time</label>
                <input 
                  type="time" 
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <p className={styles.hint}>Sleep time keeps notifications silent to respect your rest.</p>
          </section>

          {/* Section: Business Goals */}
          <section className={`card ${styles.section}`}>
            <h3 className={styles.sectionHeader}>
              <DollarSign size={16} /> Business Settings
            </h3>
            
            <div className="form-group">
              <label className="form-label">Daily Income Target (₦)</label>
              <input 
                type="number" 
                placeholder="e.g. 20000"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Weekly Market Days</label>
              <div className={styles.marketDaysRow}>
                {WEEKDAYS.map((day) => {
                  const active = weeklyMarketDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleMarketDay(day)}
                      className={`${styles.marketDayBtn} ${active ? styles.marketDayActive : ''}`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  )
                })}
              </div>
              <p className={styles.hint}>Recurring market day restocking tasks will be auto-generated on these days.</p>
            </div>
          </section>

          {/* Section: Assistant Briefings */}
          <section className={`card ${styles.section}`}>
            <h3 className={styles.sectionHeader}>
              <Bell size={16} /> Briefings & Reminders
            </h3>

            <div className={styles.settingSwitchRow}>
              <div>
                <h4 className={styles.settingLabel}>Morning Business Briefing</h4>
                <p className={styles.settingDesc}>Receive daily schedule & income progress briefing at wake up.</p>
              </div>
              <div 
                className={styles.switchContainer}
                onClick={() => setMorningBriefing(!morningBriefing)}
              >
                <input type="checkbox" checked={morningBriefing} readOnly />
              </div>
            </div>

            <div className={styles.settingSwitchRow}>
              <div>
                <h4 className={styles.settingLabel}>Evening Income Summary</h4>
                <p className={styles.settingDesc}>Gentle reminder to log sales and view daily summary before sleep.</p>
              </div>
              <div 
                className={styles.switchContainer}
                onClick={() => setEveningSummary(!eveningSummary)}
              >
                <input type="checkbox" checked={eveningSummary} readOnly />
              </div>
            </div>
          </section>

          {/* Section: Prayer & Weather (Optional Services) */}
          <section className={`card ${styles.section}`}>
            <h3 className={styles.sectionHeader}>
              <CloudRain size={16} /> Localized Services
            </h3>

            {/* Weather Alerts */}
            <div className={styles.settingSwitchRow}>
              <div>
                <h4 className={styles.settingLabel}>Weather Alerts</h4>
                <p className={styles.settingDesc}>Daily forecast alerts for outdoor market conditions.</p>
              </div>
              <div 
                className={styles.switchContainer}
                onClick={() => setWeatherAlerts(!weatherAlerts)}
              >
                <input type="checkbox" checked={weatherAlerts} readOnly />
              </div>
            </div>

            {weatherAlerts && (
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Weather Location (City)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lagos, Kano, Ibadan"
                  value={locationForWeather}
                  onChange={(e) => setLocationForWeather(e.target.value)}
                  className="form-input"
                  required={weatherAlerts}
                />
              </div>
            )}

            {/* Prayer Times */}
            <div className={styles.settingSwitchRow} style={{ borderTop: '1px solid var(--color-neutral-100)', paddingTop: 16, marginTop: 16 }}>
              <div>
                <h4 className={styles.settingLabel}>Prayer Time Reminders</h4>
                <p className={styles.settingDesc}>Auto-generate daily prayer tasks (Fajr, Zuhr, Asr, Maghrib, Isha).</p>
              </div>
              <div 
                className={styles.switchContainer}
                onClick={() => setPrayerTimes(!prayerTimes)}
              >
                <input type="checkbox" checked={prayerTimes} readOnly />
              </div>
            </div>

            {prayerTimes && (
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Prayer Calculation City</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kano, Abuja, Kaduna"
                  value={prayerLocation}
                  onChange={(e) => setPrayerLocation(e.target.value)}
                  className="form-input"
                  required={prayerTimes}
                />
              </div>
            )}
          </section>

          {/* Save Button */}
          <button 
            type="submit" 
            disabled={saving}
            className="btn btn-primary btn-large"
          >
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </button>

        </form>
      </main>
    </div>
  )
}
