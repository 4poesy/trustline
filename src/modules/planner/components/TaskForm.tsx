'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, AlertCircle, FileText, ShoppingBag, ShieldAlert } from 'lucide-react'
import { usePlanner } from '../hooks/usePlanner'
import type { TaskType, UrgencyLevel, ReminderProfile, RecurrenceType, PlannerTask } from '../types'
import { supabase } from '@/lib/supabase/client'
import styles from './TaskForm.module.css'

interface TaskFormProps {
  taskId?: string // if provided, we are editing
}

const TASK_TYPES: { id: TaskType; label: string; icon: string; bg: string }[] = [
  { id: 'personal', label: 'Personal', icon: '🏠', bg: '#FFEFE6' },
  { id: 'financial', label: 'Financial', icon: '💰', bg: '#E8F5F0' },
  { id: 'collection', label: 'Collection', icon: '📥', bg: '#eff6ff' },
  { id: 'restock', label: 'Restock', icon: '📦', bg: '#f0fdfa' },
  { id: 'market_visit', label: 'Market Visit', icon: '🏪', bg: '#fef3c7' },
  { id: 'customer_followup', label: 'Follow Up', icon: '📞', bg: '#f0f9ff' },
  { id: 'prayer', label: 'Prayer Time', icon: '🕌', bg: '#f5f3ff' },
  { id: 'health', label: 'Health', icon: '🩺', bg: '#f0fdfa' },
  { id: 'other', label: 'Other', icon: '📝', bg: '#f5f5f5' }
]

export function TaskForm({ taskId }: TaskFormProps) {
  const router = useRouter()
  const { preferences, addTask, updateTask } = usePlanner()

  const [loading, setLoading] = useState(!!taskId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Fields State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('personal')
  const [scheduledDate, setScheduledDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [scheduledTime, setScheduledTime] = useState('')
  const [isAllDay, setIsAllDay] = useState(true)
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('medium')
  const [reminderProfile, setReminderProfile] = useState<ReminderProfile>('single')
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')

  // Linking fields
  const [linkedModule, setLinkedModule] = useState<string | null>(null)
  const [linkedRecordId, setLinkedRecordId] = useState<string | null>(null)
  
  // Picker options for linking
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([])
  const [groupPurchases, setGroupPurchases] = useState<any[]>([])

  // Load task details if editing
  useEffect(() => {
    if (!taskId) return
    const loadTask = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('planner_tasks')
          .select('*')
          .eq('id', taskId)
          .single()

        if (fetchErr) throw fetchErr

        if (data) {
          const task = data as PlannerTask
          setTitle(task.title)
          setDescription(task.description || '')
          setTaskType(task.task_type)
          setScheduledDate(task.scheduled_date)
          setScheduledTime(task.scheduled_time ? task.scheduled_time.substring(0, 5) : '')
          setIsAllDay(task.is_all_day)
          setUrgencyLevel(task.urgency_level)
          setReminderProfile(task.reminder_profile)
          setRecurrence(task.recurrence || 'none')
          setLinkedModule(task.linked_module || null)
          setLinkedRecordId(task.linked_record_id || null)
        }
      } catch (err: any) {
        console.error('Error fetching task details:', err)
        setError('Failed to load task details.')
      } finally {
        setLoading(false)
      }
    }
    loadTask()
  }, [taskId])

  // Load options for linking based on selected task type
  useEffect(() => {
    const fetchLinkables = async () => {
      try {
        // Fetch invoices for Collection type
        if (taskType === 'collection') {
          const { data } = await supabase
            .from('invoices')
            .select('id, invoice_number, customer_name, amount')
            .eq('status', 'sent')
          if (data) setUnpaidInvoices(data)
        }
        // Fetch group purchases for Restock type
        if (taskType === 'restock') {
          const { data } = await supabase
            .from('group_purchases')
            .select('id, title, target_amount')
            .eq('status', 'open')
          if (data) setGroupPurchases(data)
        }
      } catch (e) {
        console.error('Error fetching linkable records:', e)
      }
    }
    fetchLinkables()
  }, [taskType])

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please enter a task title.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      task_type: taskType,
      scheduled_date: scheduledDate,
      scheduled_time: isAllDay ? null : (scheduledTime ? `${scheduledTime}:00` : null),
      is_all_day: isAllDay,
      urgency_level: urgencyLevel,
      reminder_profile: reminderProfile,
      recurrence,
      linked_module: linkedModule || null,
      linked_record_id: linkedRecordId || null,
      status: 'pending' as const,
      is_auto_generated: false
    }

    try {
      let res
      if (taskId) {
        res = await updateTask(taskId, payload)
      } else {
        res = await addTask(payload)
      }

      if (res.error) {
        throw new Error(res.error)
      }

      router.replace('/planner')
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving task.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading task details...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>{taskId ? 'Edit Task' : 'New Task'}</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorAlert}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input 
              type="text" 
              placeholder="e.g. Call Mama, Restock onion bags, Church prayer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Expressive Task Type Selection (Floating Tappable cards) */}
          <div className="form-group">
            <label className="form-label">Task Category</label>
            <div className={styles.typeGrid}>
              {TASK_TYPES.map((type) => {
                const selected = taskType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setTaskType(type.id)
                      setLinkedModule(null)
                      setLinkedRecordId(null)
                    }}
                    style={{ backgroundColor: type.bg }}
                    className={`${styles.typeCard} ${selected ? styles.typeCardActive : ''}`}
                  >
                    <span className={styles.typeIcon}>{type.icon}</span>
                    <span className={styles.typeLabel}>{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Linked module auto suggestions */}
          {taskType === 'collection' && unpaidInvoices.length > 0 && (
            <div className={styles.suggestionBlock}>
              <label className={styles.suggestionLabel}>
                <FileText size={14} /> Link to an existing open invoice?
              </label>
              <select 
                value={linkedRecordId || ''} 
                onChange={(e) => {
                  const val = e.target.value
                  setLinkedRecordId(val || null)
                  setLinkedModule(val ? 'invoices' : null)
                }}
                className="form-input"
              >
                <option value="">No, do not link</option>
                {unpaidInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    Invoice {inv.invoice_number} - {inv.customer_name} (₦{Number(inv.amount).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {taskType === 'restock' && groupPurchases.length > 0 && (
            <div className={styles.suggestionBlock}>
              <label className={styles.suggestionLabel}>
                <ShoppingBag size={14} /> Link to a bulk buy group purchase?
              </label>
              <select 
                value={linkedRecordId || ''} 
                onChange={(e) => {
                  const val = e.target.value
                  setLinkedRecordId(val || null)
                  setLinkedModule(val ? 'group_purchases' : null)
                }}
                className="form-input"
              >
                <option value="">No, do not link</option>
                {groupPurchases.map((gp) => (
                  <option key={gp.id} value={gp.id}>
                    {gp.title} (₦{Number(gp.target_amount).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time Picker */}
          <div className={styles.dateTimeRow}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Scheduled Date</label>
              <div className={styles.inputIconWrapper}>
                <Calendar size={16} className={styles.inputIcon} />
                <input 
                  type="date" 
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={`form-input ${styles.paddedInput}`}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ width: '130px' }}>
              <label className="form-label">All Day?</label>
              <div 
                className={styles.switchContainer}
                onClick={() => {
                  setIsAllDay(!isAllDay)
                  if (isAllDay) {
                    setScheduledTime('08:00')
                  }
                }}
              >
                <input 
                  type="checkbox" 
                  checked={isAllDay} 
                  readOnly 
                  style={{ cursor: 'pointer' }}
                />
                <span className={styles.switchLabel}>Yes</span>
              </div>
            </div>
          </div>

          {!isAllDay && (
            <div className="form-group">
              <label className="form-label">Scheduled Time</label>
              <div className={styles.inputIconWrapper}>
                <Clock size={16} className={styles.inputIcon} />
                <input 
                  type="time" 
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={`form-input ${styles.paddedInput}`}
                  required={!isAllDay}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea 
              placeholder="Add details, notes, phone number, location, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              style={{ minHeight: 80, resize: 'vertical' }}
            />
          </div>

          {/* Urgency selection buttons */}
          <div className="form-group">
            <label className="form-label">Urgency Level</label>
            <div className={styles.btnGroup}>
              {(['low', 'medium', 'high'] as UrgencyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUrgencyLevel(level)}
                  className={`${styles.urgencyBtn} ${urgencyLevel === level ? styles[`urgencyActive-${level}`] : ''}`}
                >
                  <span className={styles.urgencyDot} style={{
                    backgroundColor: level === 'high' ? 'var(--color-error)' : level === 'medium' ? 'var(--color-warning)' : 'var(--color-success)'
                  }} />
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
            <p className={styles.fieldHint}>
              {urgencyLevel === 'low' && 'Reminds once, 1 hour before scheduled time.'}
              {urgencyLevel === 'medium' && 'Reminds twice: 2 hours and 30 minutes before.'}
              {urgencyLevel === 'high' && 'Escalates alerts shrinking gap: 3h → 1h → 30m → 15m → 5m before.'}
            </p>
          </div>

          {/* Reminder Profile overrides */}
          <div className="form-group">
            <label className="form-label">Reminder Urgency</label>
            <div className={styles.btnGroup}>
              {(['none', 'single', 'escalating'] as ReminderProfile[]).map((profile) => (
                <button
                  key={profile}
                  type="button"
                  onClick={() => setReminderProfile(profile)}
                  className={`${styles.toggleBtn} ${reminderProfile === profile ? styles.toggleBtnActive : ''}`}
                >
                  {profile.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence Selection */}
          <div className="form-group">
            <label className="form-label">Repeats</label>
            <div className={styles.btnGroup}>
              {(['none', 'daily', 'weekly', 'monthly'] as RecurrenceType[]).map((rec) => (
                <button
                  key={rec}
                  type="button"
                  onClick={() => setRecurrence(rec)}
                  className={`${styles.toggleBtn} ${recurrence === rec ? styles.toggleBtnActive : ''}`}
                >
                  {rec.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              type="submit" 
              disabled={saving}
              className="btn btn-primary btn-large"
            >
              {saving ? 'Saving...' : taskId ? 'Save Changes' : 'Create Task'}
            </button>
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="btn btn-ghost"
              style={{ width: '100%' }}
            >
              Cancel
            </button>
          </div>

        </form>
      </main>
    </div>
  )
}
