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
 * The function asks GPT-3.5-turbo to return ONE plain-text block in the exact
 * format required by our image model:
 *
 *   Instagram Influencer Post. Description: <description>
 *
 *   Overlaid Caption: <caption>
 *
 * No markdown, JSON or extra commentary.  Everything is logged for debugging.
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@1.4.0/mod.ts";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

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
}

serve(async (req) => {
  // CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ReqBody = await req.json();
    const keyword = (body.prompt ?? "").trim();
    if (!keyword) {
      throw new Error("Missing prompt");
    }

    const focus = (body.influencer_focus ?? "lifestyle").trim();
    const name = body.display_name || body.username || "Creator";

    console.log("[generate-story-post] Incoming:", {
      prompt: keyword,
      influencer_focus: focus,
      name,
    });

    const systemPrompt =
      "You are a creative social-media marketing AI.  " +
      "Compose an image-generation prompt for an *Instagram story* that promotes the creator’s brand.  " +
      "It must inspire a visually appealing photo/illustration (no text overlay instructions).  " +
      "Return EXACTLY the following plain-text format – nothing more:\n\n" +
      "Instagram Influencer Post. Description: <one vivid sentence>\n\n" +
      "Overlaid Caption: <catchy caption ≤ 10 words>";

    const userPrompt =
      `Creator name: ${name}\n` +
      `Influencer focus: ${focus}\n` +
      `Keyword / phrase: "${keyword}"\n\n` +
      `Generate the text in the required format.`;

    const start = Date.now();
    const chatRes = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 120,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    const duration = Date.now() - start;
    const rawText = chatRes.choices[0]?.message?.content?.trim() || "";

    console.log("[generate-story-post] OpenAI latency:", duration, "ms");
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