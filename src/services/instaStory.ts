import { supabase } from './supabase';

/**
 * createInstaStory
 * 1. Ask edge function generate-story-post to craft a branded prompt & caption
 * 2. Feed entire prompt string to generate_magic_snap to get an image
 * 3. Return { url, caption }
 */
export async function createInstaStory(
  keyword: string,
  ctx: {
    username?: string | null;
    display_name?: string | null;
    influencer_focus?: string | null;
  },
  model: string = 'imagen-3.0-generate-002',
  llmProvider: 'openai' | 'gemini' = 'openai',
): Promise<{ url: string; caption: string }> {
  // ---------- Step A: build prompt & caption ----------
  const { data: promptData, error: promptErr } = await supabase.functions.invoke(
    'generate-story-post',
    {
      body: {
        prompt: keyword,
        influencer_focus: ctx.influencer_focus,
        username: ctx.username,
        display_name: ctx.display_name,
        use_gemini: llmProvider === 'gemini',
      },
    },
  );

  if (promptErr || !promptData?.text) {
    throw new Error(
      promptErr?.message || 'Failed generating story prompt',
    );
  }

  const formattedText: string = promptData.text;
  console.log('[InstaStory] Formatted prompt text →', formattedText);

  // Parse caption
  const capMatch = formattedText.match(/Overlaid Caption:\s*(.+)/i);
  const caption = capMatch ? capMatch[1].trim() : '';

  // ---------- Step B: generate image ----------
  // Build the request for generate_magic_snap so we can log it clearly
  const imageReqBody = {
    // Hint the model to produce a vertical 9:16 image
    prompt: `${formattedText}\n\nVertical portrait 9:16 aspect ratio.`,
    model,              // forward user-selected model
    aspect_ratio: '9:16',
  };

  console.log('[InstaStory] Image generation request →', {
    model,
    body: imageReqBody,
  });

  const { data: imgData, error: imgErr } = await supabase.functions.invoke(
    'generate_magic_snap',
    { body: imageReqBody },
  );

  if (imgErr || !imgData?.url) {
    throw new Error(imgErr?.message || 'Image generation failed');
  }

  console.log('[InstaStory] Image URL ←', imgData.url);

  return { url: imgData.url, caption };
}