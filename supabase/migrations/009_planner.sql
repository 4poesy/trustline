-- CREATE TABLES FOR MODULE 14: SMART DAILY PLANNER & LIFE ASSISTANT

CREATE TABLE IF NOT EXISTS planner_preferences (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  wake_up_time time NOT NULL DEFAULT '06:00',
  sleep_time time NOT NULL DEFAULT '22:00',
  morning_briefing_enabled boolean NOT NULL DEFAULT true,
  evening_summary_enabled boolean NOT NULL DEFAULT true,
  prayer_times_enabled boolean NOT NULL DEFAULT false,
  prayer_location text,
  daily_income_target numeric,
  currency text NOT NULL DEFAULT 'NGN',
  weekly_market_days jsonb DEFAULT '[]'::jsonb,
  weather_alerts_enabled boolean NOT NULL DEFAULT false,
  location_for_weather text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN (
    'personal', 'financial', 'collection', 'restock', 'market_visit',
    'customer_followup', 'prayer', 'health', 'other'
  )),
  linked_module text,
  linked_record_id uuid,
  scheduled_date date NOT NULL,
  scheduled_time time,
  is_all_day boolean NOT NULL DEFAULT false,
  urgency_level text NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high')),
  reminder_profile text NOT NULL CHECK (reminder_profile IN ('single', 'escalating', 'none')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'missed', 'snoozed')),
  completed_at timestamptz,
  is_auto_generated boolean NOT NULL DEFAULT false,
  recurrence text CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  recurrence_end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planner_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES planner_tasks(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  fired_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'fired', 'skipped', 'cancelled')),
  notification_message text NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  briefing_date date NOT NULL,
  briefing_content jsonb NOT NULL,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE planner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

-- Drop Policies if they exist (for rerun safety)
DROP POLICY IF EXISTS "Own preferences" ON planner_preferences;
DROP POLICY IF EXISTS "Own tasks" ON planner_tasks;
DROP POLICY IF EXISTS "Own notifications log" ON planner_notifications_log;
DROP POLICY IF EXISTS "Own briefings" ON daily_briefings;

-- RLS Policies
CREATE POLICY "Own preferences" ON planner_preferences FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Own tasks" ON planner_tasks FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Own notifications log" ON planner_notifications_log FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Own briefings" ON daily_briefings FOR ALL USING (auth.uid() = profile_id);
