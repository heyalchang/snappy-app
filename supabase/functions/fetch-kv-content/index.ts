// deno-lint-ignore-file no-explicit-any
/**
 * Supabase Edge Function: fetch-kv-content
 *
 * This function fetches content from a KV store API to provide context
 * for generating Instagram stories. It retrieves large text content
 * (like blog posts) that can be used to create more contextual stories.
 *
 * POST body: {
 *   url: string,           // The URL key to fetch from KV store
 *   extract?: string,      // Optional: what to extract (summary, key_points, etc.)
 *   max_length?: number    // Optional: max characters to return (default: 5000)
 * }
 *
 * Response: {
 *   success: boolean,
 *   content: string,       // The processed content
 *   metadata?: {           // Optional metadata about the content
 *     length: number,
 *     preview: string,
 *     created_at: string,
 *     updated_at: string
 *   }
 * }
 *
 * Environment variables required:
 *   - KV_STORE_API_URL: Base URL for the KV store API
 *   - KV_STORE_API_KEY: API key for authentication
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get environment variables
const KV_STORE_API_URL = Deno.env.get("KV_STORE_API_URL") || "https://imagen-proxy-server-cherryswitch.replit.app";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

interface RequestBody {
  url: string;
  extract?: "summary" | "key_points" | "themes" | "raw";
  max_length?: number;
}

async function fetchFromKVStore(url: string): Promise<any> {
  const encodedUrl = encodeURIComponent(url);
  const kvUrl = `${KV_STORE_API_URL}/api/kv/${encodedUrl}`;
  
  console.log("[fetch-kv-content] ===== KV STORE FETCH START =====");
  console.log("[fetch-kv-content] Original URL:", url);
  console.log("[fetch-kv-content] Encoded URL:", encodedUrl);
  console.log("[fetch-kv-content] Full KV API URL:", kvUrl);
  console.log("[fetch-kv-content] KV Store Base URL:", KV_STORE_API_URL);
  
  const startTime = Date.now();
  
  // No authentication needed - open KV store
  const response = await fetch(kvUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const fetchDuration = Date.now() - startTime;
  console.log("[fetch-kv-content] KV Store Response Status:", response.status);
  console.log("[fetch-kv-content] KV Store Response Time:", fetchDuration, "ms");

  if (!response.ok) {
    const error = await response.text();
    console.error("[fetch-kv-content] KV store error response:", error);
    console.error("[fetch-kv-content] ===== KV STORE FETCH ERROR =====");
    throw new Error(`KV store returned ${response.status}: ${error}`);
  }

  const data = await response.json();
  console.log("[fetch-kv-content] KV Store Response Keys:", Object.keys(data));
  console.log("[fetch-kv-content] Response success:", data.success);
  
  if (!data.success || !data.data?.value) {
    console.error("[fetch-kv-content] No content found in response");
    console.error("[fetch-kv-content] Full response:", JSON.stringify(data));
    throw new Error("No content found in KV store for this URL");
  }

  console.log("[fetch-kv-content] Content retrieved successfully");
  console.log("[fetch-kv-content] Content length:", data.data.value.length, "characters");
  console.log("[fetch-kv-content] Content preview:", data.data.value.substring(0, 200) + "...");
  console.log("[fetch-kv-content] ===== KV STORE FETCH END =====");

  return data.data;
}

async function extractContent(
  content: string, 
  extractType: string, 
  maxLength: number
): Promise<string> {
  console.log("[fetch-kv-content] ===== CONTENT EXTRACTION START =====");
  console.log("[fetch-kv-content] Extract type:", extractType);
  console.log("[fetch-kv-content] Max length:", maxLength);
  console.log("[fetch-kv-content] Original content length:", content.length);
  
  // For raw extraction, just truncate if needed
  if (extractType === "raw") {
    const truncated = content.substring(0, maxLength);
    console.log("[fetch-kv-content] Raw extraction, truncated to:", truncated.length);
    console.log("[fetch-kv-content] ===== CONTENT EXTRACTION END =====");
    return truncated;
  }

  // Use OpenAI to intelligently extract/summarize content
  const prompts: Record<string, string> = {
    summary: `Summarize this content in a way that would be useful for creating Instagram stories. Focus on visual, engaging elements. Keep it under ${maxLength} characters:\n\n${content.substring(0, 10000)}`,
    key_points: `Extract the key points from this content that would make good Instagram story topics. Format as bullet points. Keep under ${maxLength} characters:\n\n${content.substring(0, 10000)}`,
    themes: `Identify the main themes and visual concepts from this content that would work well for Instagram stories. Keep under ${maxLength} characters:\n\n${content.substring(0, 10000)}`,
  };

  const prompt = prompts[extractType] || prompts.summary;

  console.log("[fetch-kv-content] Using OpenAI to extract:", extractType);
  console.log("[fetch-kv-content] Prompt length:", prompt.length);
  console.log("[fetch-kv-content] Sending to model: gpt-4o-mini");
  
  const startTime = Date.now();
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert at extracting content for social media use. Be concise and focus on visually engaging elements.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: Math.min(1000, Math.floor(maxLength / 4)), // Rough token estimate
  });

  const extractDuration = Date.now() - startTime;
  const extracted = completion.choices[0]?.message?.content?.trim() || "";
  
  console.log("[fetch-kv-content] OpenAI extraction time:", extractDuration, "ms");
  console.log("[fetch-kv-content] Extraction complete, length:", extracted.length);
  console.log("[fetch-kv-content] Extracted preview:", extracted.substring(0, 200) + "...");
  console.log("[fetch-kv-content] ===== CONTENT EXTRACTION END =====");
  
  return extracted;
}

serve(async (req) => {
  console.log("[fetch-kv-content] ===== EDGE FUNCTION REQUEST START =====");
  console.log("[fetch-kv-content] Method:", req.method);
  console.log("[fetch-kv-content] Headers:", Object.fromEntries(req.headers.entries()));
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    console.log("[fetch-kv-content] CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    
    console.log("[fetch-kv-content] Request body:", JSON.stringify(body));
    
    // Validate input
    if (!body.url) {
      console.error("[fetch-kv-content] Missing URL in request");
      throw new Error("URL is required");
    }

    const extractType = body.extract || "summary";
    const maxLength = body.max_length || 5000;

    console.log("[fetch-kv-content] ===== PROCESSING PARAMETERS =====");
    console.log("[fetch-kv-content] URL to fetch:", body.url);
    console.log("[fetch-kv-content] Extraction type:", extractType);
    console.log("[fetch-kv-content] Max length:", maxLength);

    // Fetch content from KV store
    const kvData = await fetchFromKVStore(body.url);
    
    console.log("[fetch-kv-content] ===== PROCESSING CONTENT =====");
    console.log("[fetch-kv-content] Retrieved content length:", kvData.value.length);
    console.log("[fetch-kv-content] Content created at:", kvData.created_at);
    console.log("[fetch-kv-content] Content updated at:", kvData.updated_at);

    // Process the content based on extraction type
    const processedContent = await extractContent(
      kvData.value,
      extractType,
      maxLength
    );

    // Return the processed content ready for story generation
    const response = {
      success: true,
      content: processedContent,
      metadata: {
        length: processedContent.length,
        preview: processedContent.substring(0, 100) + "...",
        created_at: kvData.created_at,
        updated_at: kvData.updated_at,
        original_length: kvData.value.length,
        url: body.url,
        extraction_type: extractType,
      },
    };

    console.log("[fetch-kv-content] ===== RESPONSE SUMMARY =====");
    console.log("[fetch-kv-content] Success: true");
    console.log("[fetch-kv-content] Processed content length:", processedContent.length);
    console.log("[fetch-kv-content] Original content length:", kvData.value.length);
    console.log("[fetch-kv-content] Ready for story generation!");
    console.log("[fetch-kv-content] ===== EDGE FUNCTION REQUEST END =====");

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[fetch-kv-content] ===== ERROR OCCURRED =====");
    console.error("[fetch-kv-content] Error type:", error.constructor.name);
    console.error("[fetch-kv-content] Error message:", error.message);
    console.error("[fetch-kv-content] Error stack:", error.stack);
    console.error("[fetch-kv-content] ===== EDGE FUNCTION REQUEST END (ERROR) =====");
    
    const errorResponse = {
      success: false,
      error: error.message || "Failed to fetch content from KV store",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: error.message?.includes("404") ? 404 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});