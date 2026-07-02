export interface PlannerPreferences {
  profile_id: string
  wake_up_time: string
  sleep_time: string
  morning_briefing_enabled: boolean
  evening_summary_enabled: boolean
  prayer_times_enabled: boolean
  prayer_location: string | null
  daily_income_target: number | null
  currency: string
  weekly_market_days: string[]
  weather_alerts_enabled: boolean
  location_for_weather: string | null
  updated_at?: string
}

export type TaskType = 
  | 'personal'
  | 'financial'
  | 'collection'
  | 'restock'
  | 'market_visit'
  | 'customer_followup'
  | 'prayer'
  | 'health'
  | 'other'

export type UrgencyLevel = 'low' | 'medium' | 'high'
export type ReminderProfile = 'single' | 'escalating' | 'none'
export type TaskStatus = 'pending' | 'done' | 'missed' | 'snoozed'
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly'

export interface PlannerTask {
  id: string
  profile_id: string
  title: string
  description?: string
  task_type: TaskType
  linked_module?: string | null
  linked_record_id?: string | null
  scheduled_date: string // YYYY-MM-DD
  scheduled_time?: string | null // HH:MM:SS
  is_all_day: boolean
  urgency_level: UrgencyLevel
  reminder_profile: ReminderProfile
  status: TaskStatus
  completed_at?: string | null
  is_auto_generated: boolean
  recurrence?: RecurrenceType | null
  recurrence_end_date?: string | null
  created_at?: string
  updated_at?: string
}

export interface DailyBriefing {
  id: string
  profile_id: string
  briefing_date: string // YYYY-MM-DD
  briefing_content: {
    tasks_today_count: number
    tasks_breakdown: Record<TaskType, number>
    yesterday_income: number
    yesterday_target_percent?: number
    weather?: {
      temp_max: number
      precip_sum: number
      alert_msg?: string
    } | null
    financial_deadlines: Array<{
      title: string
      amount: number
      due_date: string
      module: string
    }>
    motivational_tip: string
  }
  delivered_at?: string | null
  read_at?: string | null
}
