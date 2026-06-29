/**
 * Shared base client to make structured JSON completions calls using OpenRouter.
 */
export async function callOpenRouter(systemPrompt, userPrompt) {
  // Check both VITE_ and NEXT_PUBLIC_ keys for Next.js compatibilities
  const apiKey = process.env.VITE_OPENROUTER_KEY || process.env.NEXT_PUBLIC_OPENROUTER_KEY || '';

  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured in environment variables.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://trustline.app',
      'X-Title': 'Trustline PWA',
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

  // Parse and return the JSON payload
  return JSON.parse(content.trim());
}
