import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { task_id } = await req.json()

    if (!task_id) {
      return new Response(JSON.stringify({ error: 'task_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch the task
    const { data: task, error: fetchErr } = await supabaseClient
      .from('planner_tasks')
      .select('*')
      .eq('id', task_id)
      .single()

    if (fetchErr) throw fetchErr
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 440,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Delete existing scheduled notifications for this task first (if any) to prevent duplicates
    await supabaseClient
      .from('planner_notifications_log')
      .delete()
      .eq('task_id', task_id)
      .eq('status', 'scheduled')

    if (!task.scheduled_time || task.reminder_profile === 'none') {
      return new Response(JSON.stringify({ success: true, message: 'No notification scheduled (all day or reminders disabled).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculate baseline task datetime
    const taskDateTimeStr = `${task.scheduled_date}T${task.scheduled_time}`
    const taskDateTime = new Date(taskDateTimeStr)
    if (isNaN(taskDateTime.getTime())) {
      throw new Error(`Invalid scheduled date/time: ${taskDateTimeStr}`)
    }

    // Notification offsets in milliseconds
    let offsets: number[] = [] // minutes before task
    if (task.urgency_level === 'high') {
      offsets = [180, 60, 30, 15, 5]
    } else if (task.urgency_level === 'medium') {
      offsets = [120, 30]
    } else { // low
      offsets = [60]
    }

    const insertedLogs = []

    for (const offsetMinutes of offsets) {
      const scheduledTime = new Date(taskDateTime.getTime() - offsetMinutes * 60 * 1000)
      
      // Only schedule if the notification time is in the future
      if (scheduledTime > new Date()) {
        const message = `Reminder: "${task.title}" is scheduled at ${task.scheduled_time.substring(0, 5)} (${offsetMinutes} minutes from now).`
        
        const { data: logEntry, error: logErr } = await supabaseClient
          .from('planner_notifications_log')
          .insert({
            task_id,
            profile_id: task.profile_id,
            scheduled_for: scheduledTime.toISOString(),
            status: 'scheduled',
            notification_message: message
          })
          .select()
          .single()

        if (logErr) throw logErr
        insertedLogs.push(logEntry)
      }
    }

    return new Response(JSON.stringify({ success: true, scheduled: insertedLogs.length, logs: insertedLogs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('Error scheduling task notifications:', err)
    return new Response(JSON.stringify({ error: err.message || err.toString() }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
