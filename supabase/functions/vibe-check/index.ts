// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import OpenAI from 'https://deno.land/x/openai@1.4.0/mod.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

serve(async (req) => {
  try {
    const body = (await req.json()) as any;
    // Very light validation
    if (!body?.focalMessage?.text) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = buildPrompt(body);
    const chatRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert in social dynamics and dating psychology. Return ONLY valid JSON with keys tone, inferred_meaning, key_phrase. \\nThe inferred_meaning must capture what the sender is REALLY thinking or trying to achieve (the hidden intent behind the words).',
        },
        { role: 'user', content: prompt },
      ],
    });

    const assistantMsg = chatRes.choices[0]?.message?.content?.trim() || '{}';

    // Ensure we return clean JSON ─ the model sometimes wraps the object in
    // markdown fences or adds commentary.
    let jsonPayload: unknown;
    try {
      jsonPayload = JSON.parse(assistantMsg);
    } catch {
      // Attempt to extract the first {...} block
      const match = assistantMsg.match(/\{[\s\S]*?\}/);
      if (match) {
        try {
          jsonPayload = JSON.parse(match[0]);
        } catch (innerErr) {
          console.error('VibeCheck JSON parse (regex) failed:', innerErr);
        }
      }
    }

    if (!jsonPayload || typeof jsonPayload !== 'object') {
      console.error('VibeCheck: invalid JSON from OpenAI', assistantMsg);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON produced by LLM' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify(jsonPayload), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('VibeCheck edge error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function buildPrompt(payload: any): string {
  const historyLines = payload.history
    .map((m: any) => `${m.sender}: ${m.text}`)
    .join('\n');
  return `
Analyze the focal message within context and output JSON.

### CONTEXT ###
${historyLines}

### FOCAL ###
${payload.focalMessage.sender}: ${payload.focalMessage.text}

Return JSON with tone, inferred_meaning, key_phrase.
`.trim();
}