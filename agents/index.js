const cron = require('node-cron')
const { runAjoReminderAgent } = require('./ajoReminderAgent')
const { runTrustScoreAgent } = require('./trustScoreAgent')
const { runWeeklyDigestAgent } = require('./weeklyDigestAgent')
const { isDryRun } = require('./utils')

console.log('[Agents] Starting Trustline background operations manager...')
if (isDryRun) {
  console.log('[Agents] NODE_ENV=dry-run. Alerts and database commits will be mocked.')
}

// 1. Ajo Reminder: 8:00 AM WAT (Africa/Lagos timezone)
cron.schedule('0 8 * * *', () => {
  console.log('[Cron] Starting Ajo Payment Reminder Agent...')
  runAjoReminderAgent()
}, {
  timezone: 'Africa/Lagos'
})

// 2. Score Recalculator: 12:00 AM WAT (Africa/Lagos timezone)
cron.schedule('0 0 * * *', () => {
  console.log('[Cron] Starting Trust Score Calculator Agent...')
  runTrustScoreAgent()
}, {
  timezone: 'Africa/Lagos'
})

// 3. Weekly Digest: Sunday 9:00 AM WAT (Africa/Lagos timezone)
cron.schedule('0 9 * * 0', () => {
  console.log('[Cron] Starting Weekly Digest Agent...')
  runWeeklyDigestAgent()
}, {
  timezone: 'Africa/Lagos'
})

// Proactive developer execution testing flag
if (process.argv.includes('--run-now')) {
  console.log('[Agents] --run-now flag detected. Launching synchronous dry-runs for validation...')
  ;(async () => {
    console.log('\n-- Triggering Ajo Reminder Agent --')
    await runAjoReminderAgent()
    console.log('\n-- Triggering Trust Score Calculator Agent --')
    await runTrustScoreAgent()
    console.log('\n-- Triggering Weekly Digest Agent --')
    await runWeeklyDigestAgent()
    console.log('\n[Agents] Manual testing run finished. Returning to cron triggers...')
  })()
} else {
  console.log('[Agents] Scheduler registered successfully.')
  console.log(' - Ajo Reminder Agent: Daily 8:00 AM WAT')
  console.log(' - Trust Score Agent: Daily 12:00 AM WAT')
  console.log(' - Weekly Digest Agent: Sunday 9:00 AM WAT')
}
