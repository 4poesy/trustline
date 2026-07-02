'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  CloudSun, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Lightbulb, 
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { usePlanner } from '@/modules/planner/hooks/usePlanner'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import styles from './page.module.css'

export default function DailyBriefingPage() {
  const params = useParams()
  const router = useRouter()
  const dateStr = params.date as string
  const { profile } = useAuth()
  const { fetchTasksForDate, getDailyIncomeProgress, preferences } = usePlanner()

  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [yesterdaySales, setYesterdaySales] = useState(0)
  const [financialDeadlines, setFinancialDeadlines] = useState<any[]>([])
  
  // Custom mock data that uses profile location/weather preferences
  const [weatherAlert, setWeatherAlert] = useState<any>(null)
  const [quote, setQuote] = useState('')

  const MOTIVATIONAL_QUOTES = [
    "An organized stock room leads to organized sales. Restock early to capture morning buyers.",
    "A trader's reputation is their greatest credit score. Follow up with your collection tasks today.",
    "Consistent small savings protect your business during slow market weeks. Keep group contributions active.",
    "Trust is built in drop-by-drop transactions, but lost in buckets. Deliver on your P2P payments on time.",
    "A healthy trader builds a wealthy business. Rest well and hydrate during peak afternoon sun."
  ]

  const loadBriefingData = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const today = new Date(dateStr)
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // Fetch Tasks and sales
      const [tList, yesSalesAmt] = await Promise.all([
        fetchTasksForDate(dateStr),
        getDailyIncomeProgress(yesterdayStr)
      ])

      setTasks(tList)
      setYesterdaySales(yesSalesAmt)

      // Fetch upcoming loan repayments or invoices due in next 3 days
      const threeDaysLater = new Date(today)
      threeDaysLater.setDate(today.getDate() + 3)
      const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0]

      const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_number, customer_name, amount, due_date')
        .eq('profile_id', profile.id)
        .eq('status', 'sent')
        .lte('due_date', threeDaysLaterStr)

      if (invoices) {
        setFinancialDeadlines(invoices.map(inv => ({
          title: `Invoice ${inv.invoice_number} due from ${inv.customer_name}`,
          amount: Number(inv.amount),
          due_date: inv.due_date,
          type: 'invoice'
        })))
      }

      // Weather forecast simulation using preferences location
      if (preferences?.weather_alerts_enabled && preferences?.location_for_weather) {
        setWeatherAlert({
          location: preferences.location_for_weather,
          temp: 31,
          condition: 'Sunny with moderate dust haze',
          advice: '🌡️ High of 31°C expected in afternoon. Keep your storefront well ventilated.'
        })
      } else {
        setWeatherAlert({
          location: profile.location || 'Lagos',
          temp: 29,
          condition: 'Light showers in afternoon',
          advice: '🌧️ 40% chance of rain around 2 PM. Protect outdoor market goods.'
        })
      }

      // Pick quote based on date hash
      const hash = dateStr.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      setQuote(MOTIVATIONAL_QUOTES[hash % MOTIVATIONAL_QUOTES.length])

    } catch (e) {
      console.error('Error loading briefing data:', e)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, dateStr, fetchTasksForDate, getDailyIncomeProgress, preferences])

  useEffect(() => {
    if (profile?.id) {
      loadBriefingData()
    }
  }, [profile?.id, dateStr, loadBriefingData])

  const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Generating briefing...</p>
      </div>
    )
  }

  const tasksCount = tasks.length
  const completedCount = tasks.filter(t => t.status === 'done').length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>Morning Briefing</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Date block */}
        <div className={styles.dateBlock}>
          <span className={styles.briefingSubtitle}>🌅 GOOD MORNING, {(profile?.name || 'TRADER').split(' ')[0].toUpperCase()}</span>
          <h2 className={styles.briefingDate}>{formattedDate}</h2>
        </div>

        {/* Weather advisory (Feature D) */}
        <section className={`card ${styles.card} ${styles.weatherCard}`}>
          <div className={styles.cardHeader}>
            <CloudSun className={styles.weatherIcon} />
            <div>
              <h3 className={styles.cardTitle}>Weather Advisory</h3>
              <p className={styles.cardSubtitle}>{weatherAlert?.location} · {weatherAlert?.temp}°C · {weatherAlert?.condition}</p>
            </div>
          </div>
          <p className={styles.cardContent}>{weatherAlert?.advice}</p>
        </section>

        {/* Yesterday's performance (Feature G) */}
        <section className={`card ${styles.card} ${styles.perfCard}`}>
          <div className={styles.cardHeader}>
            <TrendingUp className={styles.perfIcon} />
            <div>
              <h3 className={styles.cardTitle}>Yesterday&apos;s Financials</h3>
              <p className={styles.cardSubtitle}>Sales & income tracking</p>
            </div>
          </div>
          <p className={styles.cardContent}>
            You logged <strong>₦{yesterdaySales.toLocaleString()}</strong> in income yesterday. 
            {preferences?.daily_income_target && yesterdaySales >= Number(preferences.daily_income_target)
              ? ' 🎉 You smashed your daily target! Keep up the sales momentum today!'
              : preferences?.daily_income_target
                ? ` That was ${Math.round((yesterdaySales / Number(preferences.daily_income_target)) * 100)}% of your daily target.`
                : ' Set a daily income target in settings to track your business milestones.'
            }
          </p>
        </section>

        {/* Financial deadlines (Feature E) */}
        {financialDeadlines.length > 0 && (
          <section className={`card ${styles.card} ${styles.deadlineCard}`}>
            <div className={styles.cardHeader}>
              <AlertCircle className={styles.deadlineIcon} />
              <div>
                <h3 className={styles.cardTitle}>Upcoming Deadlines</h3>
                <p className={styles.cardSubtitle}>Next 3 days</p>
              </div>
            </div>
            <div className={styles.deadlineList}>
              {financialDeadlines.map((dl, i) => (
                <div key={i} className={styles.deadlineItem}>
                  <span>{dl.title}</span>
                  <strong>₦{dl.amount.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Today's Tasks overview */}
        <section className={`card ${styles.card} ${styles.tasksCard}`}>
          <div className={styles.cardHeader}>
            <CheckCircle className={styles.tasksIcon} />
            <div>
              <h3 className={styles.cardTitle}>Today&apos;s Agenda</h3>
              <p className={styles.cardSubtitle}>{completedCount} of {tasksCount} completed</p>
            </div>
          </div>
          {tasksCount === 0 ? (
            <p className={styles.cardContent}>You have no tasks scheduled for today. Take some time to plan your day!</p>
          ) : (
            <div className={styles.agendaList}>
              {tasks.map((task) => (
                <div key={task.id} className={`${styles.agendaItem} ${task.status === 'done' ? styles.agendaDone : ''}`}>
                  <span className={styles.agendaBullet} style={{
                    backgroundColor: task.urgency_level === 'high' ? 'var(--color-error)' : task.urgency_level === 'medium' ? 'var(--color-warning)' : 'var(--color-success)'
                  }} />
                  <span className={styles.agendaTitle}>{task.title}</span>
                  <span className={styles.agendaTime}>{task.scheduled_time ? task.scheduled_time.substring(0, 5) : 'All day'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Daily Motivation (Feature H) */}
        <section className={`card ${styles.card} ${styles.quoteCard}`}>
          <div className={styles.cardHeader}>
            <Lightbulb className={styles.quoteIcon} />
            <div>
              <h3 className={styles.cardTitle}>Trader Tip of the Day</h3>
              <p className={styles.cardSubtitle}>Daily motivation</p>
            </div>
          </div>
          <blockquote className={styles.quoteText}>&ldquo;{quote}&rdquo;</blockquote>
        </section>

        {/* Action Link to Full Planner */}
        <button 
          onClick={() => router.push('/planner')}
          className="btn btn-primary btn-large"
          style={{ width: '100%' }}
        >
          Open Schedule View
        </button>

      </main>
    </div>
  )
}
