const { rateLimitOpenRouter } = require('./utils')

/**
 * Standard CommonJS wrapper for OpenRouter chat completions inside cron agents.
 */
async function callOpenRouterAgent(systemPrompt, userPrompt) {
  const apiKey = process.env.VITE_OPENROUTER_KEY || process.env.NEXT_PUBLIC_OPENROUTER_KEY || '';

  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured in environment variables.');
  }

  // Enforce rate limiting
  await rateLimitOpenRouter();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://trustline.app',
      'X-Title': 'Trustline Cron Agents',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter completion failed: ${response.status} - ${errText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Received empty completions message from OpenRouter.');
  }

  return JSON.parse(content.trim());
}

module.exports = {
  callOpenRouterAgent
}
