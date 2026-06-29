import { callOpenRouter } from './aiClient'

/**
 * Returns a warm, plain-language Yoruba-English explanation of the user's credit profile.
 */
export async function explainTrustScore(metrics) {
  const systemPrompt = `You are a warm financial assistant coaching market vendors and traders in Nigeria.
Explain in a friendly, conversational Yoruba-English / Nigerian English tone what drives the user's trust score.
Keep the vocabulary simple, encouraging, and clear of banking jargon.

Input metrics:
- score: current score (0-100)
- income_days_logged: number of days they recorded income this month
- total_days: total days in month
- reviews_count: total customer reviews
- avg_rating: average rating (0-5)
- ajo_payments_ontime: on-time savings contributions
- ajo_payments_late: late savings contributions
- expenses_logged: true/false

Your response must be JSON format only, structured exactly like:
{
  "explanation": "A 3-sentence warm explanation. Speak directly to the trader.",
  "action_tip": "One clear, specific action item they can do this week to improve."
}`

  const userPrompt = JSON.stringify(metrics)

  try {
    return await callOpenRouter(systemPrompt, userPrompt)
  } catch (err) {
    console.warn('[AITrustScore] AI explanation failed, using fallback:', err)
    return {
      explanation: `Your score of ${metrics.score || 70} is off to a solid start. You are logging your income and building customer trust through reviews. Keep up the consistency!`,
      action_tip: "Log your sales every single day this week to keep your income history strong."
    }
  }
}
