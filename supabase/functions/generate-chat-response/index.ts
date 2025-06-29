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
  console.log(`[${new Date().toISOString()}] Incoming request: ${req.method}`)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      console.error('[ERROR] Missing OPENAI_API_KEY environment variable')
      throw new Error('Missing OPENAI_API_KEY')
    }

    const body: RequestBody = await req.json()
    console.log('[REQUEST] Processing chat for:', {
      sender: body.senderName,
      recipient: body.recipientName,
      messageCount: body.messageThread.length
    })
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

    console.log('[PERSONA] Recipient info:', {
      name: recipientName,
      age: recipientAge,
      hasPersona: !!recipientPersona,
      hasGoals: !!recipientGoals
    })

    // Create prompt for GPT-4-mini
    const prompt = `You are ${recipientName}, a ${recipientAge}-year-old with this background: ${recipientPersona}

Your messaging style and goals: ${recipientGoals}

You're chatting with ${senderName}, a ${senderAge}-year-old: ${senderPersona}

Recent conversation:
${messageHistory}

Respond naturally as ${recipientName} in ONE SHORT SENTENCE (under 15 words). Be authentic to your persona and age. Keep it casual and conversational.`

    console.log('[OPENAI] Sending request to GPT-4o-mini')
    const startTime = Date.now()
    
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

    const responseTime = Date.now() - startTime
    console.log(`[OPENAI] Response received in ${responseTime}ms, status: ${response.status}`)

    if (!response.ok) {
      const error = await response.text()
      console.error('[OPENAI] API error:', error)
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content.trim()
    
    console.log('[SUCCESS] Generated response:', {
      response: aiResponse,
      length: aiResponse.length,
      model: data.model,
      usage: data.usage
    })

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[ERROR] Function failed:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    })
    
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
    console.log('[FALLBACK] Using fallback response:', fallbackResponse)
    
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