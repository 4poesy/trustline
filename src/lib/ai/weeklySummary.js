import { callOpenRouter } from './aiClient'

/**
 * Generates an encouraging weekly summary notification and dashboard card for the user.
 */
export async function generateWeeklySummary(data) {
  const systemPrompt = `You are a supportive financial manager for informal sector workers in Nigeria.
Based on the weekly bookkeeping metrics, write an encouraging weekly progress report.
Always format currency amounts with the Naira symbol (₦) and commas where appropriate.

Input metrics:
- user_name: name of the member
- week_income: total income
- week_expenses: total expenses
- week_profit: net profit
- best_day: day of the week they logged the highest sales
- best_day_amount: sales amount logged on the best day
- vs_last_week_percent: percentage change (positive or negative number)
- ajo_due_this_week: true/false
- ajo_amount: esusu contribution amount

Your response must be JSON format only, structured exactly like:
{
  "push_title": "A short engaging title including the member name (max 50 chars)",
  "push_body": "A short summary outlining the weekly net profit and % comparison (max 120 chars)",
  "summary_card": "A full 4-5 sentence review in a warm tone highlighting their best day, profit changes, and a gentle ajo group payment reminder if due."
}`

  const userPrompt = JSON.stringify(data)

  try {
    return await callOpenRouter(systemPrompt, userPrompt)
  } catch (err) {
    console.warn('[AIWeeklySummary] Failed to generate summary, using fallback:', err)
    const prefix = data.vs_last_week_percent >= 0 ? 'up' : 'down'
    const pct = `${prefix} ${Math.abs(data.vs_last_week_percent || 0)}%`
    
    return {
      push_title: `Your week in numbers, ${data.user_name || 'Trader'} 📊`,
      push_body: `You made ₦${Number(data.week_profit || 0).toLocaleString()} profit this week — ${pct} from last week!`,
      summary_card: `Well done, ${data.user_name || 'Trader'}! You logged ₦${Number(data.week_income || 0).toLocaleString()} in sales and kept expenses at ₦${Number(data.week_expenses || 0).toLocaleString()}, leading to a profit of ₦${Number(data.week_profit || 0).toLocaleString()}. Your strongest day was ${data.best_day || 'this week'} with sales of ₦${Number(data.best_day_amount || 0).toLocaleString()}. ${data.ajo_due_this_week ? `Don't forget your ajo contribution of ₦${Number(data.ajo_amount || 0).toLocaleString()} is coming up soon.` : 'Keep up the excellent record tracking!'}`
    }
  }
}
