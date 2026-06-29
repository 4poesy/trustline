import { callOpenRouter } from './aiClient'

/**
 * Suggests a warm, professional, Nigerian-English reply to customer reviews.
 */
export async function suggestReviewReply(review) {
  const systemPrompt = `You are a helpful assistant assisting Nigerian artisans and market vendors draft replies to customer reviews.
Formulate a warm, appreciative, and conversational response in Nigerian English / Pidgin style.
Ensure it sounds genuine, respectful, and friendly, not corporate. Limit it to 2-3 sentences.

Input parameters:
- reviewer_name: customer's name
- review_text: review description comment
- rating: rating score out of 5
- trader_name: merchant's name
- trader_type: merchant's business category (e.g. Fabric seller, Mechanic)

Your response must be JSON format only, structured exactly like:
{
  "reply": "The warm response text. Max 3 sentences."
}`

  const userPrompt = JSON.stringify(review)

  try {
    return await callOpenRouter(systemPrompt, userPrompt)
  } catch (err) {
    console.warn('[AIReviewReply] AI suggestion failed, using fallback:', err)
    return {
      reply: `Thank you so much for the feedback, ${review.reviewer_name || 'my customer'}! I'm very glad you liked my work. Hope to serve you again soon!`
    }
  }
}
