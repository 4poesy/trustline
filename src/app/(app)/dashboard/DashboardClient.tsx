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
  Trash2
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
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [trustScore, setTrustScore] = useState<number | null>(null)
  const [creditBand, setCreditBand] = useState('Building')
  const [loading, setLoading] = useState(true)

  // Calculator State
  const [salesInput, setSalesInput] = useState('')
  const [expensesInput, setExpensesInput] = useState('')

  // To-Do List State
  const [todoList, setTodoList] = useState<{ id: string; text: string; completed: boolean }[]>([])
  const [newTodoText, setNewTodoText] = useState('')

  // Load To-dos
  useEffect(() => {
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
  }, [profile.id])

  const saveTodos = (updated: typeof todoList) => {
    setTodoList(updated)
    localStorage.setItem(`trustline_todos_${profile.id}`, JSON.stringify(updated))
  }

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoText.trim()) return
    const newItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false
    }
    saveTodos([...todoList, newItem])
    setNewTodoText('')
  }

  const handleToggleTodo = (id: string) => {
    const updated = todoList.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    )
    saveTodos(updated)
  }

  const handleDeleteTodo = (id: string) => {
    const updated = todoList.filter(item => item.id !== id)
    saveTodos(updated)
  }

  const salesVal = parseFloat(salesInput) || 0
  const expensesVal = parseFloat(expensesInput) || 0
  const profitVal = salesVal - expensesVal
  const profitMargin = salesVal > 0 ? (profitVal / salesVal) * 100 : 0

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
        {/* Quick Stats Grid */}
        <section className={styles.statsGrid}>
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`card ${styles.statCard}`}
          >
            <div className={styles.statIcon}>
              <DollarSign size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                ₦{monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              <span className={styles.statLabel}>This month&apos;s income</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link href="/credit-profile" className={`card ${styles.statCard} ${styles.statCardLink}`}>
              <div className={`${styles.statIcon} ${styles.statIconSecondary}`}>
                <Award size={20} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>
                  {loading ? '--' : `${trustScore} (${creditBand})`}
                </span>
                <span className={styles.statLabel}>Trust score &rarr;</span>
              </div>
            </Link>
          </motion.div>
        </section>

        {/* Dynamic score progress indicator on dashboard */}
        <AnimatePresence>
          {!loading && trustScore !== null && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`card ${styles.scoreBarCard}`}
            >
              <div className={styles.scoreHeader}>
                <span className={styles.scoreTitle}>CREDIT HEALTH</span>
                <span className={styles.scorePercent}>{trustScore}/100</span>
              </div>
              <div className={styles.progressBarBg}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${trustScore}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  className={styles.progressBarFill}
                />
              </div>
              <p className={styles.scoreTip}>
                Grow your credit score by recording transactions and saving weekly.
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Module action cards - Grid layout */}
        <section className={styles.actionCards}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>

          <div className={styles.actionGrid}>
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -4 }} 
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/cashflow" className={`card ${styles.actionCard}`} id="cashflow-action-card">
                <div className={`${styles.actionIcon} ${styles.actionIconCashflow}`}>
                  <Activity size={24} />
                </div>
                <h3 className={styles.actionTitle}>Track Cashflow</h3>
                <p className={styles.actionDescription}>Log daily income &amp; expenses to build your financial record</p>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -4 }} 
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/directory" className={`card ${styles.actionCard}`} id="directory-action-card">
                <div className={`${styles.actionIcon} ${styles.actionIconDirectory}`}>
                  <BookOpen size={24} />
                </div>
                <h3 className={styles.actionTitle}>Public Profile</h3>
                <p className={styles.actionDescription}>Get found by customers and grow your reputation</p>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ y: -4 }} 
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/savings" className={`card ${styles.actionCard}`} id="savings-action-card">
                <div className={`${styles.actionIcon} ${styles.actionIconSavings}`}>
                  <Users size={24} />
                </div>
                <h3 className={styles.actionTitle}>Savings Groups</h3>
                <p className={styles.actionDescription}>Join or create an ajo/esusu group and save together</p>
              </Link>
            </motion.div>
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

                <Link 
                  href={{
                    pathname: '/cashflow/add',
                    query: { 
                      type: 'income', 
                      amount: profitVal > 0 ? profitVal.toString() : '0',
                      description: 'Daily calculated sales profit'
                    }
                  }} 
                  className={styles.logButton}
                >
                  Log Profit to Cashflow
                </Link>
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
