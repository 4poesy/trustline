import { callOpenRouter } from './aiClient'

const CACHE_KEY = 'trustline_ai_category_cache'

function getLocalCache() {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function setLocalCache(cache) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.warn('LocalStorage cache write skipped:', e)
  }
}

/**
 * Automagically categorises user transactions based on descriptions using OpenRouter AI.
 * Caches results locally to avoid unnecessary billing API calls.
 */
export async function categoriseIncome(description, amount) {
  if (!description || !description.trim()) {
    return { category: 'Miscellaneous', subcategory: 'Uncategorized', confidence: 1.0 }
  }

  const cleanDesc = description.trim().toLowerCase()
  const cache = getLocalCache()

  if (cache[cleanDesc]) {
    return cache[cleanDesc]
  }

  const systemPrompt = `You are a financial categorizer for Nigeria's informal economy.
Analyze the user's transaction description and amount to assign a category and subcategory.
Choose the primary category STRICTLY from this list:
- Food & Provisions
- Fabric & Clothing
- Electronics
- Services (hair, tailoring, mechanical)
- Transportation
- Savings Contribution
- Ajo Payment
- Loan Repayment
- Miscellaneous

Your response must be JSON format only, structured exactly like:
{
  "category": "Primary Category String chosen strictly from list above",
  "subcategory": "Short specific sub-segment string (e.g. Textiles, Okada Fare, Fuel, Provisions)",
  "confidence": 0.95
}`

  const userPrompt = JSON.stringify({ description, amount })

  try {
    const response = await callOpenRouter(systemPrompt, userPrompt)
    
    // Save to cache
    cache[cleanDesc] = response
    setLocalCache(cache)

    return response
  } catch (err) {
    console.warn('[AICategoriser] Failed to categorize transaction, using fallback:', err)
    return {
      category: 'Miscellaneous',
      subcategory: 'Uncategorized',
      confidence: 0.5
    }
  }
}
