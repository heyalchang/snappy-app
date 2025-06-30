// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { OpenAI } from 'https://deno.land/x/openai@v4.20.1/mod.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

serve(async (req) => {
  try {
    // Parse body
    const payload = await req.json();

    // Basic validation
    if (!Array.isArray(payload?.conversation_history)) {
      return json({ error: 'Invalid payload (conversation_history)' }, 400);
    }

    // Ensure strategy_pool exists even if client omitted it
    if (!Array.isArray(payload?.strategy_pool) || payload.strategy_pool.length === 0) {
      payload.strategy_pool = [
        'STRATEGY_PROJECT_CONFIDENCE',
        'STRATEGY_ASSESS_COMPATIBILITY',
        'STRATEGY_KEEP_CASUAL',
      ];
    }

    // Debug logs so we can confirm both fields arrive
    console.log('↪︎ generate-reply-options | strategy:', payload.strategy);
    console.log('↪︎ generate-reply-options | strategy_pool:', payload.strategy_pool);

    const prompt = buildPrompt(payload);

    const chatRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'You are a creative, strategic dating conversationalist. Return ONLY valid JSON { "suggestions": [ ... ] }. Each suggestion ≤ 10 words. Index 0 must fulfil the user strategy, index 1 neutral/flirty, index 2 practical/low-effort. No commentary.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const raw = chatRes.choices[0]?.message?.content?.trim() || '{}';

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    if (!parsed?.suggestions || !Array.isArray(parsed.suggestions)) {
      return json({ error: 'Invalid JSON from model' }, 500);
    }

    // Enforce max 3 suggestions & max 10 words each
    parsed.suggestions = parsed.suggestions
      .slice(0, 3)
      .map((s: string) => s.split(/\s+/).slice(0, 10).join(' '));

    return json(parsed, 200);
  } catch (err) {
    console.error('generate-reply-options error:', err);
    return json({ error: 'Internal error' }, 500);
  }
});

function buildPrompt(p: any): string {
  const {
    strategy,
    strategy_pool,
    draft_text,
    conversation_history,
  } = p;

  return `
PRIMARY STRATEGY: ${strategy}
STRATEGY POOL   : ${strategy_pool.join(', ')}

GUIDELINES:
• Return ONLY valid JSON { "suggestions":[...] } – no markdown, no commentary.
• Array length MUST be 3.
• Each suggestion MUST be a chat-ready message (not instructions) and ≤ 10 words.
• Index 0 MUST satisfy PRIMARY STRATEGY.
• Index 1 SHOULD be neutral / flirty.
• Index 2 SHOULD be practical / low-effort.

CONVERSATION HISTORY (oldest → newest):
${conversation_history
    .map((m: any) => `${m.sender}: ${m.text}`)
    .join('\n')}

CURRENT DRAFT (may be empty): "${draft_text}"
`.trim();
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}