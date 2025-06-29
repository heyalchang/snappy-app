/**
 * Supabase Edge Function: generate_magic_snap
 *
 * POST body (JSON): { 
 *   prompt?: string,
 *   model?: string,  // Model name without "models/" prefix
 *   usePlaceholder?: boolean  // Force placeholder mode
 * }
 * Returns: { url: string }
 *
 * This function:
 * 1. Calls Google AI image-generation API to create an image for the prompt
 * 2. Uploads the PNG to the `magic-snaps` Storage bucket
 * 3. Responds with a signed URL so the client can display it
 *
 * Available models:
 *  - imagen-3.0-generate-002 (Default - Imagen 3.0)
 *  - imagen-4.0-generate-preview-06-06 (Imagen 4.0 - for future use)
 *  - placeholder (uses placeholder service for testing)
 *
 * Environment variables required (set in the Supabase dashboard):
 *  - SUPABASE_URL          – inserted automatically by Supabase
 *  - SUPABASE_ANON_KEY     – inserted automatically by Supabase
 * 
 * Note: No API key needed - uses imagen-proxy-server at https://imagen-proxy-server-cherryswitch.replit.app/
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";
import { serve } from "https://deno.land/std@0.173.0/http/server.ts";

/* ---------- Environment ---------- */

// No API key needed for the imagen-proxy-server
const GEMINI_API_KEY = null; // Deprecated - using proxy server instead

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Use service role key for storage operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* ---------- Constants ---------- */

const SUPPORTED_MODELS = [
  "imagen-3.0-generate-002",
  "imagen-4.0-generate-preview-06-06",  // Keep for future use
  "placeholder",
];

const DEFAULT_MODEL = "imagen-3.0-generate-002";

/* ---------- Helpers ---------- */

/**
 * Generate a placeholder image with text using SVG.
 * Edge functions can't make external HTTP requests, so we create a simple SVG.
 */
async function generatePlaceholderImage(prompt: string): Promise<Uint8Array> {
  console.log("[generatePlaceholderImage] Creating SVG placeholder for:", prompt);

  const width = 512;
  const height = 512;
  const text = prompt.substring(0, 30);

  // Create a simple SVG with the prompt text
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#4f46e5"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
        fill="white" font-family="Arial" font-size="24" font-weight="bold">
    ${text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)}
  </text>
</svg>`;

  // For now, return a simple purple PNG since SVG to PNG conversion is complex in Deno
  // This is a 100x100 purple PNG with white border
  const purplePng = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 100, 0, 0, 0, 100,
    8, 2, 0, 0, 0, 255, 128, 2, 3, 0, 0, 0, 12, 73, 68, 65, 84, 120, 218, 237, 221, 49, 13, 0,
    32, 8, 0, 65, 239, 159, 198, 224, 0, 54, 192, 6, 216, 0, 27, 224, 183, 255, 251, 46, 200,
    66, 16, 132, 32, 8, 66, 16, 132, 32, 8, 66, 16, 132, 32, 8, 66, 16, 132, 32, 8, 66, 16, 132,
    32, 8, 66, 16, 132, 32, 8, 66, 16, 132, 32, 8, 66, 16, 132, 32, 8, 66, 16, 132, 32, 8, 66,
    16, 132, 32, 8, 66, 16, 132, 32, 8, 66, 16, 4, 62, 179,
    1, 237, 29, 41, 158, 240, 20, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
  ]);

  console.log("[generatePlaceholderImage] Returning purple PNG, size:", purplePng.length);
  return purplePng;
}

/**
 * Call Imagen Proxy API to generate a real image.
 */
async function generateRealImage(prompt: string, model: string): Promise<Uint8Array> {
  console.log("[generateRealImage] Model:", model, "Prompt:", prompt);

  // Use the imagen-proxy-server API
  const endpoint = "https://imagen-proxy-server-cherryswitch.replit.app/api/generate";

  const requestBody = {
    prompt: prompt,
    num_images: 1,
    model: model // Use the model passed in (defaults to imagen-3.0-generate-002)
  };

  console.log("[generateRealImage] Calling imagen-proxy API:", endpoint);
  console.log("[generateRealImage] Request body:", JSON.stringify(requestBody));

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  console.log("[generateRealImage] Response:", res.status, res.statusText);

  if (!res.ok) {
    const errText = await res.text();
    console.error("[generateRealImage] API error:", errText);
    throw new Error(`Imagen proxy API error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  console.log("[generateRealImage] API response:", JSON.stringify(json));
  
  // The API returns { success: true, images: [{data: base64, filename: string}], count: number }
  if (!json.success || !json.images || json.images.length === 0) {
    console.error("[generateRealImage] Invalid API response:", JSON.stringify(json));
    throw new Error("No image data returned from Imagen proxy API");
  }

  const base64Image = json.images[0].data;
  if (!base64Image) {
    console.error("[generateRealImage] No image data in first image:", JSON.stringify(json.images[0]));
    throw new Error("No image data in API response");
  }

  console.log("[generateRealImage] Successfully received base64 image data.");

  // Decode base64 to Uint8Array
  // Note: Can't import from lib/blob.ts in Edge Function, so keeping inline
  const binaryString = atob(base64Image);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Main image generation function that routes to appropriate implementation.
 */
async function generateImage(prompt: string, model: string): Promise<Uint8Array> {
  console.log("[generateImage] Starting with model:", model, "prompt:", prompt);

  // Validate model
  if (!SUPPORTED_MODELS.includes(model)) {
    console.error("[generateImage] Invalid model:", model);
    throw new Error(`Unsupported model: ${model}. Supported: ${SUPPORTED_MODELS.join(", ")}`);
  }

  // If placeholder is requested, generate a placeholder.
  if (model === "placeholder") {
    console.log("[generateImage] Placeholder model requested. Generating placeholder.");
    return generatePlaceholderImage(prompt);
  }

  // Otherwise, generate a real image.
  console.log("[generateImage] Generating real image with model:", model);
  return generateRealImage(prompt, model);
}

/**
 * Upload byte array to Supabase Storage and return a public URL.
 */
async function uploadAndGetPublicUrl(bytes: Uint8Array, filename: string): Promise<string> {
  const bucket = "magic-snaps";

  console.log("[uploadAndGetPublicUrl] Starting upload to PUBLIC bucket:", bucket);
  console.log("[uploadAndGetPublicUrl] Filename:", filename);
  console.log("[uploadAndGetPublicUrl] File size:", bytes.length, "bytes");

  // Upload – disable upsert to avoid accidental overwrites.
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filename, bytes.buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    console.error("[uploadAndGetPublicUrl] Upload failed:", uploadError);
    throw uploadError;
  }

  console.log("[uploadAndGetPublicUrl] Upload successful, getting public URL...");

  // Get public URL for the uploaded file (no signing needed for public bucket)
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename);

  if (!data?.publicUrl) {
    console.error("[uploadAndGetPublicUrl] Failed to get public URL");
    throw new Error("No public URL returned");
  }

  console.log("[uploadAndGetPublicUrl] Public URL retrieved successfully:", data.publicUrl);
  return data.publicUrl;
}

/* ---------- Handler ---------- */

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
    });
  }

  console.log("[generate_magic_snap] Request received:", {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  });

  if (req.method !== "POST") {
    console.log("[generate_magic_snap] Rejected non-POST request");
    return new Response("Method Not Allowed", { 
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
  }

  try {
    // Parse request body
    const body = await req.json().catch((err) => {
      console.error("[generate_magic_snap] Failed to parse JSON body:", err);
      return {};
    });

    console.log("[generate_magic_snap] Request body:", JSON.stringify(body));

    const { prompt, model, usePlaceholder } = body;
    const textPrompt =
      prompt?.toString().trim() ||
      "random jungle animal cartoon character riding a surfboard";

    // Determine which model to use
    let selectedModel = model?.toString().trim() || DEFAULT_MODEL;
    if (usePlaceholder === true) {
      selectedModel = "placeholder";
    }

    console.log("[generate_magic_snap] Processing request:", {
      prompt: textPrompt,
      model: selectedModel,
      usingProxy: true
    });

    // 1. Generate image
    console.log("[generate_magic_snap] Calling generateImage...");
    const bytes = await generateImage(textPrompt, selectedModel);
    console.log("[generate_magic_snap] Image generated successfully, size:", bytes.length, "bytes");

    // 2. Upload & get public URL
    const filename = `${Date.now()}.png`;
    console.log("[generate_magic_snap] Uploading to storage as:", filename);
    const url = await uploadAndGetPublicUrl(bytes, filename);
    console.log("[generate_magic_snap] Upload successful, public URL retrieved");

    // 3. Return JSON
    const response = { url };
    console.log("[generate_magic_snap] Returning success response");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate_magic_snap] Error occurred:", {
      error: err,
      message: (err as Error).message,
      stack: (err as Error).stack,
    });

    const errorResponse = {
      error: (err as Error).message ?? "Unknown error",
      details: (err as Error).stack
    };

    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});