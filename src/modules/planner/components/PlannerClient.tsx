'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Check, 
  Trash2, 
  MapPin, 
  CheckCircle,
  Briefcase,
  User,
  Activity,
  Heart,
  HelpCircle,
  DollarSign,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react'
import { usePlanner } from '../hooks/usePlanner'
import type { PlannerTask, TaskType } from '../types'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import styles from './PlannerClient.module.css'

const TASK_TYPE_MAP: Record<TaskType, { label: string; icon: string; colorClass: string; bgClass: string }> = {
  personal: { label: 'Personal', icon: '🏠', colorClass: styles.typePersonal, bgClass: styles.bgPersonal },
  financial: { label: 'Financial', icon: '💰', colorClass: styles.typeFinancial, bgClass: styles.bgFinancial },
  collection: { label: 'Collection', icon: '📥', colorClass: styles.typeCollection, bgClass: styles.bgCollection },
  restock: { label: 'Restock', icon: '📦', colorClass: styles.typeRestock, bgClass: styles.bgRestock },
  market_visit: { label: 'Market Visit', icon: '🏪', colorClass: styles.typeMarket, bgClass: styles.bgMarket },
  customer_followup: { label: 'Follow Up', icon: '📞', colorClass: styles.typeFollowup, bgClass: styles.bgFollowup },
  prayer: { label: 'Prayer Time', icon: '🕌', colorClass: styles.typePrayer, bgClass: styles.bgPrayer },
  health: { label: 'Health', icon: '🩺', colorClass: styles.typeHealth, bgClass: styles.bgHealth },
  other: { label: 'Other', icon: '📝', colorClass: styles.typeOther, bgClass: styles.bgOther }
}

export function PlannerClient() {
  const router = useRouter()
  const { profile } = useAuth()
  const { 
    preferences, 
    loading: prefLoading, 
    fetchTasksForDate, 
    fetchOverdueTasks, 
    updateTask, 
    deleteTask,
    getDailyIncomeProgress 
  } = usePlanner()

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [tasks, setTasks] = useState<PlannerTask[]>([])
  const [overdueTasks, setOverdueTasks] = useState<PlannerTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  
  // Daily Target Tracking State
  const [dailyIncome, setDailyIncome] = useState(0)

  // Follow-up suggestions state
  const [suggestions, setSuggestions] = useState<Array<{
    id: string
    type: 'p2p' | 'invoice'
    title: string
    subtitle: string
    actionText: string
    params: any
  }>>([])

  // Modal / Detail state
  const [activeTask, setActiveTask] = useState<PlannerTask | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Calendar Strip Dates (7 days starting from today/yesterday)
  const weekDates = useMemo(() => {
    const arr = []
    const start = new Date()
    start.setDate(start.getDate() - 1) // start from yesterday
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      arr.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
      })
    }
    return arr
  }, [])

  // Load Data
  const loadPlannerData = useCallback(async () => {
    if (!profile?.id) return
    setLoadingTasks(true)
    try {
      const [tList, ovList, inc] = await Promise.all([
        fetchTasksForDate(selectedDate),
        fetchOverdueTasks(new Date().toISOString().split('T')[0]),
        getDailyIncomeProgress(selectedDate)
      ])
      
      setTasks(tList)
      setOverdueTasks(ovList)
      setDailyIncome(inc)

      // Fetch follow-up suggestions
      const suggestionsList: any[] = []
      
      // 1. Unpaid invoices suggestions
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_name, amount, due_date')
        .eq('profile_id', profile.id)
        .eq('status', 'sent')
        .limit(2)

      if (invoices && invoices.length > 0) {
        invoices.forEach(inv => {
          suggestionsList.push({
            id: `inv-${inv.id}`,
            type: 'invoice',
            title: `Invoice ${inv.invoice_number} is Unpaid`,
            subtitle: `Remind ${inv.customer_name} to pay ₦${Number(inv.amount).toLocaleString()}`,
            actionText: 'Create Follow-up',
            params: {
              title: `Remind ${inv.customer_name} of invoice ${inv.invoice_number}`,
              type: 'customer_followup',
              linked_module: 'invoices',
              linked_record_id: inv.id
            }
          })
        })
      }

      // 2. Repeat P2P customer follow-ups (more than 14 days ago)
      const { data: p2ps } = await supabase
        .from('p2p_transfers')
        .select('sender_name, sender_id, created_at, amount')
        .eq('receiver_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(2)

      if (p2ps && p2ps.length > 0) {
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
        
        p2ps.forEach((p, idx) => {
          const pDate = new Date(p.created_at)
          if (pDate < fourteenDaysAgo) {
            suggestionsList.push({
              id: `p2p-${idx}`,
              type: 'p2p',
              title: `Follow up with ${p.sender_name}`,
              subtitle: `Last payment received ${pDate.toLocaleDateString()} · ₦${Number(p.amount).toLocaleString()}`,
              actionText: 'Add Task',
              params: {
                title: `Check in with ${p.sender_name} for new orders`,
                type: 'customer_followup',
                linked_module: 'p2p_transfers',
                linked_record_id: p.sender_id
              }
            })
          }
        })
      }

      setSuggestions(suggestionsList)

    } catch (e) {
      console.error('Error loading planner view:', e)
    } finally {
      setLoadingTasks(false)
    }
  }, [profile?.id, selectedDate, fetchTasksForDate, fetchOverdueTasks, getDailyIncomeProgress])

  useEffect(() => {
    if (profile?.id) {
      loadPlannerData()
    }
  }, [profile?.id, selectedDate, loadPlannerData])

  // Handle Task Completion Toggle
  const handleToggleTask = async (task: PlannerTask, e: React.MouseEvent) => {
    e.stopPropagation()
    setUpdatingId(task.id)
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null
    
    const res = await updateTask(task.id, { status: newStatus, completed_at: completedAt })
    setUpdatingId(null)
    if (res.success) {
      // update local task state
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: completedAt } : t))
      setOverdueTasks(prev => prev.filter(t => t.id !== task.id))
    }
  }

  // Handle suggested task creation
  const handleCreateSuggestion = async (params: any, suggestionId: string) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('planner_tasks')
        .insert({
          profile_id: profile?.id,
          title: params.title,
          task_type: params.type,
          linked_module: params.linked_module,
          linked_record_id: params.linked_record_id,
          scheduled_date: todayStr,
          urgency_level: 'medium',
          reminder_profile: 'single',
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      
      // Update local task lists if selected date is today
      if (selectedDate === todayStr) {
        setTasks(prev => [...prev, data as PlannerTask])
      }
      
      // Remove suggestion card
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    } catch (err) {
      console.error('Error creating suggested task:', err)
    }
  }

  // Handle Delete
  const handleDeleteTask = async (taskId: string) => {
    const res = await deleteTask(taskId)
    if (res.success) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setOverdueTasks(prev => prev.filter(t => t.id !== taskId))
      setActiveTask(null)
    }
  }

  // Format Time (12 hour)
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return 'All Day'
    const [hour, min] = timeStr.split(':')
    const h = parseInt(hour, 10)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 || 12
    return `${displayHour}:${min} ${ampm}`
  }

  // Income target metrics
  const targetMet = preferences?.daily_income_target 
    ? dailyIncome >= Number(preferences.daily_income_target)
    : false
  const targetPercent = preferences?.daily_income_target
    ? Math.min(100, Math.round((dailyIncome / Number(preferences.daily_income_target)) * 100))
    : 0

  return (
    <div className={styles.page}>
      {/* Sticky Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Daily Planner</h1>
          <Link href="/settings/planner" className={styles.settingsLink} title="Planner Settings">
            <Sparkles size={20} />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        
        {/* Income Target Progress Widget */}
        {preferences?.daily_income_target && (
          <section className={`card ${styles.targetCard}`}>
            <div className={styles.targetHeader}>
              <div className={styles.targetTitleBlock}>
                <TrendingUp size={16} className={styles.targetIcon} />
                <span className={styles.targetLabel}>DAILY INCOME TARGET</span>
              </div>
              <span className={styles.targetNumbers}>
                ₦{dailyIncome.toLocaleString()} / ₦{Number(preferences.daily_income_target).toLocaleString()}
              </span>
            </div>
            
            <div className={styles.progressContainer}>
              <div 
                className={`${styles.progressBar} ${targetMet ? styles.progressSmashed : targetPercent >= 80 ? styles.progressNear : styles.progressNormal}`} 
                style={{ width: `${targetPercent}%` }}
              />
            </div>
            
            <p className={styles.targetMessage}>
              {targetMet 
                ? '🎯 Target smashed! Excellent sales performance today!'
                : dailyIncome === 0 
                  ? 'No sales logged today. Log sales in cashflow to track target!'
                  : `${targetPercent}% of daily goal reached. ₦${(Number(preferences.daily_income_target) - dailyIncome).toLocaleString()} to go!`
              }
            </p>
          </section>
        )}

        {/* Calendar Strip */}
        <section className={styles.calendarStrip}>
          <div className={styles.stripScroll}>
            {weekDates.map((day) => {
              const active = selectedDate === day.dateStr
              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`${styles.dateCard} ${active ? styles.dateActive : ''}`}
                >
                  <span className={styles.dayName}>{day.dayName}</span>
                  <span className={styles.dayNum}>{day.dayNum}</span>
                  {day.isToday && <span className={styles.todayIndicator} />}
                </button>
              )
            })}
          </div>
        </section>

        {/* Overdue Tasks Alert Banner */}
        {overdueTasks.length > 0 && (
          <div className={styles.overdueBanner}>
            <AlertCircle size={16} className={styles.overdueIcon} />
            <div className={styles.overdueText}>
              <span>You have <strong>{overdueTasks.length}</strong> tasks from yesterday.</span>
              <button onClick={() => setViewMode(viewMode === 'week' ? 'day' : 'week')} className={styles.overdueBtn}>
                View Overdue
              </button>
            </div>
          </div>
        )}

        {/* Morning Briefing Link */}
        <Link href={`/planner/briefing/${selectedDate}`} className={`card ${styles.briefingCard}`}>
          <div className={styles.briefingLeft}>
            <span className={styles.briefingEmoji}>🌅</span>
            <div>
              <h3 className={styles.briefingTitle}>Daily Business Briefing</h3>
              <p className={styles.briefingDesc}>Check weather, schedules, targets, and tips for today</p>
            </div>
          </div>
          <ChevronRight size={18} className={styles.briefingArrow} />
        </Link>

        {/* Tasks Section */}
        <section className={styles.tasksSection}>
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionTitle}>
              {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}&apos;s Schedule
            </h2>
            <div className={styles.viewToggles}>
              <button 
                onClick={() => setViewMode('day')} 
                className={`${styles.toggleBtn} ${viewMode === 'day' ? styles.toggleActive : ''}`}
              >
                Day
              </button>
              <button 
                onClick={() => setViewMode('week')} 
                className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.toggleActive : ''}`}
              >
                All Outstanding
              </button>
            </div>
          </div>

          {loadingTasks ? (
            <div className={styles.loader}>
              <span className="spinner" />
              <p>Loading schedule...</p>
            </div>
          ) : (
            <div className={styles.taskList}>
              {/* If viewMode is Day, show selectedDate tasks. If Outstanding, show overdue + selectedDate pending */}
              {((viewMode === 'day' ? tasks : [...overdueTasks, ...tasks])).length === 0 ? (
                <div className={styles.emptyTasks}>
                  <div className={styles.emptyIcon}>📅</div>
                  <h3>Your schedule is clear</h3>
                  <p>Add business or personal tasks to organize your hustle.</p>
                </div>
              ) : (
                ((viewMode === 'day' ? tasks : [...overdueTasks, ...tasks])).map((task) => {
                  const typeDetails = TASK_TYPE_MAP[task.task_type] || TASK_TYPE_MAP.other
                  const isDone = task.status === 'done'
                  
                  return (
                    <motion.div
                      layoutId={task.id}
                      key={task.id}
                      onClick={() => setActiveTask(task)}
                      className={`${styles.taskCard} ${isDone ? styles.taskCompleted : ''}`}
                    >
                      <button 
                        onClick={(e) => handleToggleTask(task, e)}
                        disabled={updatingId === task.id}
                        className={`${styles.checkbox} ${isDone ? styles.checkboxChecked : ''}`}
                      >
                        {isDone && <Check size={12} className={styles.checkIcon} />}
                      </button>

                      <div className={styles.taskBody}>
                        <div className={styles.taskMetaRow}>
                          <span className={styles.taskTime}>
                            <Clock size={12} className={styles.timeIcon} />
                            {formatTime(task.scheduled_time)}
                          </span>
                          <span className={`${styles.typeBadge} ${typeDetails.bgClass}`}>
                            {typeDetails.icon} {typeDetails.label}
                          </span>
                          {task.is_auto_generated && (
                            <span className={styles.autoBadge}>Auto</span>
                          )}
                        </div>

                        <h3 className={styles.taskTitle}>{task.title}</h3>
                        
                        {task.description && (
                          <p className={styles.taskDesc}>{task.description}</p>
                        )}

                        {task.linked_module && (
                          <span className={styles.linkedBadge}>
                            🔗 {task.linked_module.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className={`${styles.urgencyBar} ${
                        task.urgency_level === 'high' 
                          ? styles.urgencyHigh 
                          : task.urgency_level === 'medium' 
                            ? styles.urgencyMedium 
                            : styles.urgencyLow
                      }`} />
                    </motion.div>
                  )
                })
              )}
            </div>
          )}
        </section>

        {/* Suggested Tasks (Feature I) */}
        {suggestions.length > 0 && (
          <section className={styles.suggestionsSection}>
            <div className={styles.suggestionsTitleBlock}>
              <Sparkles size={16} className={styles.suggestIcon} />
              <h2 className={styles.sectionTitle}>Smart Suggestions</h2>
            </div>
            
            <div className={styles.suggestionsScroll}>
              {suggestions.map((sug) => (
                <div key={sug.id} className={`card ${styles.suggestionCard}`}>
                  <div className={styles.sugLeft}>
                    <span className={styles.sugBadge}>
                      {sug.type === 'invoice' ? '📄 Invoice' : ' P2P'}
                    </span>
                    <h4 className={styles.sugTitle}>{sug.title}</h4>
                    <p className={styles.sugSubtitle}>{sug.subtitle}</p>
                  </div>
                  <button 
                    onClick={() => handleCreateSuggestion(sug.params, sug.id)}
                    className={`btn btn-secondary ${styles.sugBtn}`}
                  >
                    {sug.actionText}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Floating Action Button */}
      <Link href="/planner/add" className={styles.fab} aria-label="Add Task" id="add-task-fab">
        <Plus size={24} />
      </Link>

      {/* Task Details Popup Modal */}
      <AnimatePresence>
        {activeTask && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTask(null)}
              className={styles.modalBackdrop}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={styles.modalPanel}
            >
              <div className={styles.modalHeader}>
                <span className={`${styles.typeBadge} ${TASK_TYPE_MAP[activeTask.task_type]?.bgClass}`}>
                  {TASK_TYPE_MAP[activeTask.task_type]?.icon} {TASK_TYPE_MAP[activeTask.task_type]?.label}
                </span>
                <button onClick={() => setActiveTask(null)} className={styles.modalCloseBtn}>✕</button>
              </div>

              <div className={styles.modalBody}>
                <h2 className={styles.modalTitle}>{activeTask.title}</h2>
                {activeTask.description && (
                  <p className={styles.modalDesc}>{activeTask.description}</p>
                )}

                <div className={styles.detailRows}>
                  <div className={styles.detailRow}>
                    <Calendar size={16} />
                    <span>Date: {new Date(activeTask.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <Clock size={16} />
                    <span>Time: {formatTime(activeTask.scheduled_time)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <Info size={16} />
                    <span>Urgency: <strong style={{ textTransform: 'capitalize' }}>{activeTask.urgency_level}</strong></span>
                  </div>
                  <div className={styles.detailRow}>
                    <Sparkles size={16} />
                    <span>Notification Profile: <strong style={{ textTransform: 'capitalize' }}>{activeTask.reminder_profile.replace('_', ' ')}</strong></span>
                  </div>
                  {activeTask.recurrence && activeTask.recurrence !== 'none' && (
                    <div className={styles.detailRow}>
                      <Activity size={16} />
                      <span>Repeats: <strong style={{ textTransform: 'capitalize' }}>{activeTask.recurrence}</strong></span>
                    </div>
                  )}
                </div>

                <div className={styles.modalActions}>
                  <button 
                    onClick={() => {
                      router.push(`/planner/edit/${activeTask.id}`)
                    }}
                    className={`btn btn-secondary ${styles.actionBtn}`}
                  >
                    Edit Task
                  </button>
                  
                  {!activeTask.is_auto_generated && (
                    <button 
                      onClick={() => handleDeleteTask(activeTask.id)}
                      className={`btn ${styles.deleteBtn}`}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
