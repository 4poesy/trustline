'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  Award, 
  ArrowRight, 
  BookOpen, 
  Users, 
  MapPin, 
  LogOut, 
  DollarSign, 
  Activity,
  ArrowLeft,
  Calculator,
  CheckSquare,
  Plus,
  Trash2,
  CreditCard,
  Coins,
  Shield,
  Store,
  QrCode,
  FileText
} from 'lucide-react'
import { getCreditScore } from '@/lib/supabase/creditScore'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/modules/cashflow/db/cashflow-db'
import type { Profile } from '@/lib/supabase/types'
import styles from './page.module.css'

interface Props {
  profile: Profile
}

export function DashboardClient({ profile }: Props) {
  const router = useRouter()
  
  // Return null safe guard to prevent runtime errors if profile is empty
  if (!profile || !profile.id) {
    return null
  }

  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [trustScore, setTrustScore] = useState<number | null>(null)
  const [creditBand, setCreditBand] = useState('Building')
  const [loading, setLoading] = useState(true)
  const [walletBalance, setWalletBalance] = useState(0)
  const [currency, setCurrency] = useState('NGN')

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('wallet_balance, currency')
          .eq('id', profile.id)
          .single()
        if (data) {
          setWalletBalance(Number(data.wallet_balance || 0))
          setCurrency(data.currency || 'NGN')
        }
      } catch (e) {
        console.error('Error fetching wallet on dashboard:', e)
      }
    }
    if (profile.id) {
      fetchWallet()
    }
  }, [profile.id])

  const getCurrencySymbol = (cur: string, loc?: string) => {
    if (cur === 'GHS' || (loc && loc.toLowerCase().includes('ghana'))) return '₵'
    if (cur === 'KES' || (loc && loc.toLowerCase().includes('kenya'))) return 'KSh'
    if (cur === 'ZAR' || (loc && loc.toLowerCase().includes('south africa'))) return 'R'
    if (cur === 'UGX' || (loc && loc.toLowerCase().includes('uganda'))) return 'USh'
    if (cur === 'TZS' || (loc && loc.toLowerCase().includes('tanzania'))) return 'TSh'
    if (cur === 'XAF' || (loc && loc.toLowerCase().includes('cameroon'))) return 'FCFA'
    return '₦'
  }

  // Calculator State
  const [salesInput, setSalesInput] = useState('')
  const [expensesInput, setExpensesInput] = useState('')

  // To-Do List State
  const [todoList, setTodoList] = useState<{ id: string; text: string; completed: boolean }[]>([])
  const [newTodoText, setNewTodoText] = useState('')
  const [loggingProfit, setLoggingProfit] = useState(false)
  const [logSuccess, setLogSuccess] = useState(false)

  // Load To-dos
  useEffect(() => {
    if (!profile?.id) return
    const saved = localStorage.getItem(`trustline_todos_${profile.id}`)
    if (saved) {
      try {
        setTodoList(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    } else {
      const defaults = [
        { id: '1', text: "Log today's morning sales", completed: false },
        { id: '2', text: 'Check my credit score progress', completed: false },
        { id: '3', text: 'Share public business card link', completed: false }
      ]
      setTodoList(defaults)
      localStorage.setItem(`trustline_todos_${profile.id}`, JSON.stringify(defaults))
    }
  }, [profile?.id])

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoText.trim() || !profile?.id) return
    const newItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false
    }
    setTodoList(prev => {
      const updated = [...prev, newItem]
      localStorage.setItem(`trustline_todos_${profile.id}`, JSON.stringify(updated))
      return updated
    })
    setNewTodoText('')
  }

  const handleToggleTodo = (id: string) => {
    if (!profile?.id) return
    setTodoList(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
      localStorage.setItem(`trustline_todos_${profile.id}`, JSON.stringify(updated))
      return updated
    })
  }

  const handleDeleteTodo = (id: string) => {
    if (!profile?.id) return
    setTodoList(prev => {
      const updated = prev.filter(item => item.id !== id)
      localStorage.setItem(`trustline_todos_${profile.id}`, JSON.stringify(updated))
      return updated
    })
  }

  const salesVal = parseFloat(salesInput) || 0
  const expensesVal = parseFloat(expensesInput) || 0
  const profitVal = salesVal - expensesVal
  const profitMargin = salesVal > 0 ? (profitVal / salesVal) * 100 : 0

  const handleLogToCashflow = async () => {
    if (salesVal <= 0 && expensesVal <= 0 || !profile?.id) return
    setLoggingProfit(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      
      if (salesVal > 0) {
        await db.table('transactions').add({
          id: crypto.randomUUID(),
          profile_id: profile.id,
          type: 'income',
          amount: salesVal,
          category: 'Sales',
          note: 'Logged via Daily Profit Calculator',
          entry_date: todayStr,
          created_at: new Date().toISOString(),
          synced_at: null
        })
      }
      
      if (expensesVal > 0) {
        await db.table('transactions').add({
          id: crypto.randomUUID(),
          profile_id: profile.id,
          type: 'expense',
          amount: expensesVal,
          category: 'Cost of Goods',
          note: 'Logged via Daily Profit Calculator',
          entry_date: todayStr,
          created_at: new Date().toISOString(),
          synced_at: null
        })
      }

      setLogSuccess(true)
      setSalesInput('')
      setExpensesInput('')
      
      // Refresh dashboard monthly income metric
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const txs = await db.table('transactions')
        .where('profile_id')
        .equals(profile.id)
        .and(t => t.type === 'income' && t.entry_date >= firstDayOfMonth)
        .toArray()
      const total = txs.reduce((sum, t) => sum + t.amount, 0)
      setMonthlyIncome(total)

      setTimeout(() => setLogSuccess(false), 3000)
    } catch (err) {
      console.error('Error logging profit directly to cashflow:', err)
    } finally {
      setLoggingProfit(false)
    }
  }

  useEffect(() => {
    const fetchMonthlyIncome = async () => {
      try {
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        
        const txs = await db.table('transactions')
          .where('profile_id')
          .equals(profile.id)
          .and(t => t.type === 'income' && t.entry_date >= firstDayOfMonth)
          .toArray()
          
        const total = txs.reduce((sum, t) => sum + t.amount, 0)
        setMonthlyIncome(total)
      } catch (e) {
        console.error('Error fetching monthly income for dashboard:', e)
      }
    }
    
    fetchMonthlyIncome()
  }, [profile.id])

  useEffect(() => {
    const fetchTrustScore = async () => {
      try {
        const { data } = await getCreditScore(profile.id)
        if (data) {
          setTrustScore(data.score)
          setCreditBand(data.band)
        }
      } catch (e) {
        console.error('Error fetching trust score:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchTrustScore()
  }, [profile.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'trader': return 'Trader'
      case 'service_provider': return 'Service Provider'
      case 'group_member': return 'Savings Group Member'
      default: return role
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={styles.page}
    >
      {/* Header section with stagnant solid green background and gold wavy divider */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <Link href="/" className={styles.backArrowLink} title="Back to main website">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className={styles.greeting}>{getGreeting()},</span>
              <h1 className={styles.userName}>{profile.name}</h1>
            </div>
          </div>
          <button
            className={styles.avatarButton}
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            id="sign-out-button"
          >
            <LogOut size={16} className={styles.logoutIcon} />
          </button>
        </div>
        <div className={styles.roleBadgeContainer}>
          <span className={styles.roleBadge}>
            <span className={styles.roleBadgeDot} />
            {getRoleLabel(profile.role)}
            {profile.business_type && ` · ${profile.business_type}`}
          </span>
        </div>

        {/* Replicated Gold Wavy Divider at bottom of header */}
        <div className={styles.headerBorderBottom}>
          <svg className={styles.waveSvg} viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60 L1200,120 L0,120 Z" fill="var(--color-background)"></path>
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60" fill="none" stroke="var(--color-secondary-500)" strokeWidth="3"></path>
          </svg>
        </div>
      </header>

      <main className={styles.main}>
        {/* Unified Financial & Trust Overview Card */}
        <section className={styles.overviewSection}>
          <div className={`card ${styles.overviewCard} ${styles.animateFadeIn}`}>
            <div className={styles.overviewLeft}>
              <div className={styles.overviewMeta}>
                <span className={styles.overviewSubtitle}>FINANCIAL OVERVIEW</span>
                <h2 className={styles.overviewTitle}>Business Health</h2>
              </div>
              
              <div className={styles.walletMetricBlock}>
                <span className={styles.walletLabel}>WALLET BALANCE</span>
                <div className={styles.walletValueRow}>
                  <span className={styles.walletValue}>
                    {getCurrencySymbol(currency, profile.location)}
                    {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                  <Link href="/pay/fund" className={`btn ${styles.fundBtnMini}`} id="dashboard-fund-wallet-button">
                    + Fund
                  </Link>
                </div>
              </div>

              <div className={styles.revenueMetricBlock}>
                <span className={styles.revenueLabel}>
                  Monthly Sales: {getCurrencySymbol(currency, profile.location)}
                  {monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className={styles.overviewActions}>
                <Link href="/credit-profile" className={styles.overviewLink}>
                  View Credit Health Report <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className={styles.overviewRight}>
              <span className={styles.gaugeTitle}>TRUST SCORE</span>
              <Link href="/credit-profile" className={styles.gaugeWrapper} title="View Credit Profile details">
                <div className={styles.gaugeContainer}>
                  <svg className={styles.gaugeSvg} viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className={styles.gaugeTrack}
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      className={styles.gaugeFill}
                      strokeWidth="8"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray="314.16"
                      initial={{ strokeDashoffset: 314.16 }}
                      animate={{ strokeDashoffset: 314.16 - (314.16 * (trustScore || 0)) / 100 }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    />
                  </svg>
                  <div className={styles.gaugeContent}>
                    <span className={styles.gaugeScore}>{loading ? '--' : trustScore}</span>
                    <span className={styles.gaugeBand}>{loading ? 'Loading...' : creditBand}</span>
                  </div>
                </div>
              </Link>
              <p className={styles.gaugeTip}>
                Your reputation rating is calculated from transaction consistency and ajo savings history.
              </p>
            </div>
          </div>
        </section>

        {/* Module action cards - Grid layout */}
        <section className={styles.actionCards}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>

          <div className={styles.actionGrid}>
            <Link href="/cashflow" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay1}`} id="cashflow-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconCashflow}`}>
                <Activity size={24} />
              </div>
              <h3 className={styles.actionTitle}>Track Cashflow</h3>
              <p className={styles.actionDescription}>Log daily income &amp; expenses to build your financial record</p>
            </Link>

            <Link href="/directory" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay2}`} id="directory-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconDirectory}`}>
                <BookOpen size={24} />
              </div>
              <h3 className={styles.actionTitle}>Public Profile</h3>
              <p className={styles.actionDescription}>Get found by customers and grow your reputation</p>
            </Link>

            <Link href="/savings" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay3}`} id="savings-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconSavings}`}>
                <Users size={24} />
              </div>
              <h3 className={styles.actionTitle}>Savings Groups</h3>
              <p className={styles.actionDescription}>Join or create an ajo/esusu group and save together</p>
            </Link>

            <Link href="/pay" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay4}`} id="pay-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconBills}`}>
                <CreditCard size={24} />
              </div>
              <h3 className={styles.actionTitle}>Pay Bills</h3>
              <p className={styles.actionDescription}>Buy airtime, data, electricity, and TV subscriptions</p>
            </Link>

            <Link href="/loans" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay1}`} id="loans-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconLoans}`}>
                <Coins size={24} />
              </div>
              <h3 className={styles.actionTitle}>Find Loans</h3>
              <p className={styles.actionDescription}>Discover matched loan offers from verified lenders</p>
            </Link>

            <Link href="/insurance" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay2}`} id="insurance-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconInsurance}`}>
                <Shield size={24} />
              </div>
              <h3 className={styles.actionTitle}>Micro-Insurance</h3>
              <p className={styles.actionDescription}>Protect your inventory, health, and devices</p>
            </Link>

            <Link href="/group-commerce" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay3}`} id="group-commerce-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconGroupCommerce}`}>
                <Store size={24} />
              </div>
              <h3 className={styles.actionTitle}>Group Buy</h3>
              <p className={styles.actionDescription}>Pool funds with others to purchase goods in bulk</p>
            </Link>

            <Link href="/insights" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay4}`} id="insights-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconInsights}`}>
                <TrendingUp size={24} />
              </div>
              <h3 className={styles.actionTitle}>Business Insights</h3>
              <p className={styles.actionDescription}>View sales analytics and competitive benchmarks</p>
            </Link>

            <Link href="/my-qr" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay1}`} id="qr-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconQr}`}>
                <QrCode size={24} />
              </div>
              <h3 className={styles.actionTitle}>My QR Code</h3>
              <p className={styles.actionDescription}>Receive instant scan-to-pay payments from customers</p>
            </Link>

            <Link href="/invoices" className={`card ${styles.actionCard} ${styles.animateFadeIn} ${styles.delay2}`} id="invoices-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconInvoices}`}>
                <FileText size={24} />
              </div>
              <h3 className={styles.actionTitle}>Invoices</h3>
              <p className={styles.actionDescription}>Generate and send invoices to track customer payments</p>
            </Link>
          </div>
        </section>

        {/* Business Tools Section (Calculator & To-Do List) */}
        <section className={styles.toolsSection}>
          <div className={styles.toolsGrid}>
            
            {/* Profit Calculator */}
            <div className={styles.toolCard}>
              <div className={styles.toolHeader}>
                <Calculator size={22} className={styles.toolIcon} />
                <h3 className={styles.toolTitle}>Daily Profit Calculator</h3>
              </div>
              <div className={styles.calcForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Total Sales / Revenue</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.currencyPrefix}>₦</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={salesInput}
                      onChange={(e) => setSalesInput(e.target.value)}
                      className={styles.numericInput}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Total Cost / Expenses</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.currencyPrefix}>₦</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={expensesInput}
                      onChange={(e) => setExpensesInput(e.target.value)}
                      className={styles.numericInput}
                    />
                  </div>
                </div>

                <div className={styles.calcResults}>
                  <div className={styles.resultBox}>
                    <span className={styles.resultLabel}>Net Profit</span>
                    <span className={`${styles.resultValue} ${profitVal < 0 ? styles.resultMarginNegative : ''}`}>
                      ₦{profitVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={styles.resultBox}>
                    <span className={styles.resultLabel}>Profit Margin</span>
                    <span className={`${styles.resultValue} ${
                      profitVal < 0 
                        ? styles.resultMarginNegative 
                        : profitMargin >= 20 
                          ? styles.resultMarginPositive 
                          : styles.resultMarginWarning
                    }`}>
                      {profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleLogToCashflow}
                  disabled={loggingProfit || (salesVal <= 0 && expensesVal <= 0)}
                  className={styles.logButton}
                  style={{ width: '100%' }}
                >
                  {loggingProfit ? 'Logging...' : logSuccess ? 'Success ✓' : 'Log Profit to Cashflow'}
                </button>

                {logSuccess && (
                  <span style={{ fontSize: '11px', color: 'var(--color-primary-500)', fontWeight: 'bold', textAlign: 'center', display: 'block', marginTop: '8px' }}>
                    Transactions logged successfully to Cashflow database!
                  </span>
                )}
              </div>
            </div>

            {/* Daily To-Do Checklist */}
            <div className={styles.toolCard}>
              <div className={styles.toolHeader}>
                <CheckSquare size={22} className={styles.toolIcon} />
                <h3 className={styles.toolTitle}>Daily Business Tasks</h3>
              </div>
              
              <form onSubmit={handleAddTodo} className={styles.todoForm}>
                <input 
                  type="text" 
                  placeholder="Add a new business task..." 
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  className={styles.todoInput}
                />
                <button type="submit" className={styles.todoAddBtn} aria-label="Add task">
                  <Plus size={20} />
                </button>
              </form>

              <div className={styles.todoList}>
                {todoList.length === 0 ? (
                  <div className={styles.todoEmpty}>No tasks left for today!</div>
                ) : (
                  todoList.map(todo => (
                    <div key={todo.id} className={styles.todoItem}>
                      <div className={styles.todoItemLeft}>
                        <input 
                          type="checkbox" 
                          checked={todo.completed} 
                          onChange={() => handleToggleTodo(todo.id)}
                          className={styles.todoCheckbox}
                        />
                        <span className={`${styles.todoText} ${todo.completed ? styles.todoCompleted : ''}`}>
                          {todo.text}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteTodo(todo.id)} 
                        className={styles.todoDeleteBtn}
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </section>

        {/* Location indicator */}
        <div className={styles.locationBar}>
          <MapPin size={16} className={styles.locationIcon} />
          <span>Active in {profile.location}</span>
        </div>
      </main>
    </motion.div>
  )
}
