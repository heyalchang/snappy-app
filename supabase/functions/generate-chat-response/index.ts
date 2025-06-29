import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  senderName: string
  senderPersona: string
  senderAge: number
  recipientName: string
  recipientPersona: string
  recipientAge: number
  recipientGoals: string
  messageThread: Array<{
    sender: string
    content: string
    timestamp: string
  }>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('Missing OPENAI_API_KEY')
    }

    const body: RequestBody = await req.json()
    const {
      senderName,
      senderPersona,
      senderAge,
      recipientName,
      recipientPersona,
      recipientAge,
      recipientGoals,
      messageThread
    } = body

    // Format message history for context
    const messageHistory = messageThread
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n')

    // Create prompt for GPT-4-mini
    const prompt = `You are ${recipientName}, a ${recipientAge}-year-old with this background: ${recipientPersona}

Your messaging style and goals: ${recipientGoals}

You're chatting with ${senderName}, a ${senderAge}-year-old: ${senderPersona}

Recent conversation:
${messageHistory}

Respond naturally as ${recipientName} in ONE SHORT SENTENCE (under 15 words). Be authentic to your persona and age. Keep it casual and conversational.`

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a teenager/young adult responding to a friend. Keep responses very short, casual, and authentic.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 30,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content.trim()

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    
    // Fallback responses if AI fails
    const fallbacks = [
      "Hey! What's up?",
      "That's cool!",
      "For real?",
      "Nice 😊",
      "Sounds good!",
      "LOL yeah",
      "Bet",
      "Same here"
    ]
    
    const fallbackResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    
    return new Response(
      JSON.stringify({ 
        response: fallbackResponse,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 even on error to not break the chat
      }
    )
  }
})