# Trustline Operations Agents

This folder contains background operational task agents that automate Trustline's cashflow, credit, and savings reminders. They are designed to run as lightweight Node.js worker services triggered by schedules or API endpoints.

---

## Agent List & Schedules

| Agent Name | Script | Trigger Schedule | Purpose |
| :--- | :--- | :--- | :--- |
| **Ajo Payment Reminder** | `ajoReminderAgent.js` | 8:00 AM WAT Daily | Identifies members who haven't paid their current savings cycle contributions and sends push/WhatsApp reminders. |
| **Trust Score Calculator** | `trustScoreAgent.js` | 12:00 AM WAT Nightly | Computes Trust Scores (0-100) based on income records, reviews, ajo reliability, profile details, and account age. |
| **Weekly Digest** | `weeklyDigestAgent.js` | 9:00 AM WAT Sunday | Aggregates 7-day transactional statistics and triggers personalized AI weekly summaries. |

---

## Table Schemas Required
Please execute the SQL migration script located in [schema_agents.sql](file:///c:/Users/Akinola%20Olujobi/Desktop/Trustline/docs/schema_agents.sql) in your Supabase dashboard to create the matching tables:
- **`trust_scores`**: Log table tracking historic credit points over time.
- **`agent_logs`**: System audit table logging successes and exceptions.
- **`notifications`**: Database table storing in-app alerts.

---

## Running Agents Locally

### 1. Standard Armed Mode
To launch the coordinator to start node-cron listeners:
```bash
npm run agents
```

### 2. Manual Immediate Execution
To force all scheduled tasks to run immediately (useful for testing or local debug):
```bash
npm run agents -- --run-now
```

### 3. Dry-Run Mode
To execute operations in dry-run mode (printing logs of what it would trigger without writing to Supabase or sending web push/WhatsApp messages):
```bash
$env:NODE_ENV="dry-run"; npm run agents -- --run-now
```
*(On standard bash terminals, run `NODE_ENV=dry-run npm run agents -- --run-now`)*

---

## Technical Features Implemented
- **Rate-Limiting**: A global API request manager (`utils.js`) restricts calls to OpenRouter (`deepseek/deepseek-chat`) to a maximum of 10 requests per minute (6-second delay throttle) to avoid billing blockages.
- **Error Logging**: All script exceptions are caught and logged automatically to the `agent_logs` table in Supabase.
- **Timezone Presets**: Schedulers are explicitly configured using `'Africa/Lagos'` timezone (West Africa Time - WAT).
