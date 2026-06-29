const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local or .env if they exist
const envPaths = [
  path.join(__dirname, '../.env.local'),
  path.join(__dirname, '../.env')
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    content.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        const key = match[1]
        let val = match[2] || ''
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1)
        }
        if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
          val = val.substring(1, val.length - 1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    })
    break
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Agents] Critical: Supabase credentials not found in environment.')
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseServiceKey || 'placeholder-key'
)

const isDryRun = process.env.NODE_ENV === 'dry-run'

/**
 * Commits cron operations audit run logs to Supabase
 */
async function logAgentRun(agentName, status, message) {
  console.log(`[${agentName}] ${status.toUpperCase()}: ${message}`)
  if (isDryRun) {
    console.log(`[${agentName}] [DRY-RUN] Skipped saving log to Supabase.`)
    return
  }

  try {
    const { error } = await supabase
      .from('agent_logs')
      .insert({
        agent_name: agentName,
        status,
        message
      })
    if (error) console.error('[Agents] Log write failure:', error)
  } catch (err) {
    console.error('[Agents] Exception saving log:', err)
  }
}

// Global throttle tracking for OpenRouter requests
let lastCallTime = 0

/**
 * Enforces a strict rate-limit of 10 requests per minute (6s intervals)
 */
async function rateLimitOpenRouter() {
  const minInterval = 6000 // 6 seconds
  const now = Date.now()
  const elapsed = now - lastCallTime
  if (elapsed < minInterval) {
    const waitTime = minInterval - elapsed
    console.log(`[Rate Limiter] Throttling for ${waitTime}ms...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  lastCallTime = Date.now()
}

module.exports = {
  supabase,
  isDryRun,
  logAgentRun,
  rateLimitOpenRouter
}
