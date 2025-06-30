// deno-lint-ignore-file no-explicit-any
/**
 * Supabase Edge Function: generate-story-post
 *
 * Body: {
 *   prompt: string,               // required keyword/phrase
 *   influencer_focus?: string,    // e.g. "travel", "food", "fitness"
 *   username?: string,            // creator username (for flavour)
 *   display_name?: string         // creator display name
 * }
 *
 * Response: { text: string }
 *
 * The function asks GPT-4.1 to return ONE plain-text block in the exact
 * format required by our image model:
 *
 *   Instagram Influencer Post. Description: <description>
 *
 *   Overlaid Caption: <caption>
 *
 * No markdown, JSON or extra commentary.  Everything is logged for debugging.
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") ?? "",
});

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReqBody {
  prompt?: string;
  influencer_focus?: string;
  username?: string;
  display_name?: string;
  kv_content?: string;  // Optional contextual content from KV store
}

async function callGemini(prompt: string): Promise<string> {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY not set");
  }
  const res = await fetch(`${GEMINI_URL}?key=${GOOGLE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text.trim();
}

serve(async (req) => {
  // CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ReqBody & { use_gemini?: boolean } = await req.json();
    const keyword = (body.prompt ?? "").trim();
    if (!keyword) {
      throw new Error("Missing prompt");
    }

    const useGemini = body.use_gemini === true;

    const focus = (body.influencer_focus ?? "lifestyle").trim();
    const name = body.display_name || body.username || "Creator";

    const kvContent = body.kv_content;

    console.log("[generate-story-post] Incoming:", {
      prompt: keyword,
      influencer_focus: focus,
      name,
      use_gemini: useGemini,
      has_kv_content: !!kvContent,
      kv_content_length: kvContent?.length || 0,
    });

    if (kvContent) {
      console.log("[generate-story-post] KV Content preview:", kvContent.substring(0, 200) + "...");
    }

    const systemPrompt =
      "You are a creative social-media marketing AI.  " +
      "Compose an image-generation prompt for an *Instagram influencer post* that promotes the creator’s brand.  " +
      "It should heavily inspired by the influencer's focus.  It must inspire a visually appealing photo/illustration (no text overlay instructions).  " +
      "Return EXACTLY the following plain-text format – nothing more:\n\n" +
      "Instagram Influencer Post. Description: <one vivid sentence>\n\n" +
      "Overlaid Caption: <catchy caption ≤ 10 words>";

    let userPrompt =
      `Creator name: ${name}\n` +
      `Influencer focus: ${focus}\n` +
      `Keyword / phrase: "${keyword}"\n`;
    
    // Add KV content if provided
    if (kvContent) {
      userPrompt += `\nContextual content from blog/article:\n${kvContent}\n`;
      userPrompt += `\nUse the above contextual content to create a more informed and relevant Instagram post that relates to the keyword while incorporating insights from the content.\n`;
    }
    
    userPrompt += `\nGenerate the text in the required format.  The description must be emotionally resonant and heavily inspired by the influencer's focus.`;

    const start = Date.now();
    let rawText = "";
    if (useGemini) {
      const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
      console.log("[generate-story-post] Sending to Gemini:");
      console.log("=== FULL GEMINI PROMPT START ===");
      console.log(combinedPrompt);
      console.log("=== FULL GEMINI PROMPT END ===");
      
      rawText = await callGemini(combinedPrompt);
    } else {
      console.log("[generate-story-post] Sending to OpenAI:");
      console.log("=== OPENAI SYSTEM PROMPT START ===");
      console.log(systemPrompt);
      console.log("=== OPENAI SYSTEM PROMPT END ===");
      console.log("=== OPENAI USER PROMPT START ===");
      console.log(userPrompt);
      console.log("=== OPENAI USER PROMPT END ===");
      
      const chatRes = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      rawText = chatRes.choices[0]?.message?.content?.trim() || "";
    }
    const duration = Date.now() - start;

    console.log(
      `[generate-story-post] LLM latency (${
        useGemini ? "Gemini" : "OpenAI"
      }):`,
      duration,
      "ms",
    );
    console.log("[generate-story-post] Raw response:\n", rawText);

    // Very light validation: must contain both markers
    if (
      !/Instagram Influencer Post\./i.test(rawText) ||
      !/Overlaid Caption:/i.test(rawText)
    ) {
      console.error("[generate-story-post] Invalid format");
      throw new Error("LLM produced invalid format");
    }

    return new Response(JSON.stringify({ text: rawText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[generate-story-post] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});