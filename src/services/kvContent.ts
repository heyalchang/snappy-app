/**
 * Service for fetching content from KV store to enhance story generation
 */

import { supabase } from './supabase';

export interface KVContentOptions {
  url: string;
  extract?: 'summary' | 'key_points' | 'themes' | 'raw';
  maxLength?: number;
}

export interface KVContentResponse {
  success: boolean;
  content?: string;
  metadata?: {
    length: number;
    preview: string;
    created_at: string;
    updated_at: string;
    original_length: number;
  };
  error?: string;
}

/**
 * Fetch content from KV store for story generation context
 */
export async function fetchKVContent(options: KVContentOptions): Promise<KVContentResponse> {
  try {
    console.log('[kvContent] Fetching content from KV store:', options);

    const { data, error } = await supabase.functions.invoke('fetch-kv-content', {
      body: {
        url: options.url,
        extract: options.extract || 'summary',
        max_length: options.maxLength || 5000,
      },
    });

    if (error) {
      console.error('[kvContent] Error calling edge function:', error);
      throw error;
    }

    console.log('[kvContent] Successfully fetched content:', {
      success: data.success,
      contentLength: data.content?.length,
      metadata: data.metadata,
    });

    return data;
  } catch (error) {
    console.error('[kvContent] Failed to fetch KV content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content',
    };
  }
}

/**
 * Generate a story post with additional context from KV store
 */
export async function generateStoryWithContext(
  prompt: string,
  influencerFocus: string,
  kvUrl?: string,
  username?: string,
  displayName?: string
): Promise<{ text: string; context?: string }> {
  try {
    // If a KV URL is provided, fetch context first
    let context: string | undefined;
    
    if (kvUrl) {
      console.log('[kvContent] Fetching context for story generation from:', kvUrl);
      
      const kvResponse = await fetchKVContent({
        url: kvUrl,
        extract: 'themes', // Get themes for story generation
        maxLength: 2000, // Limit context size
      });

      if (kvResponse.success && kvResponse.content) {
        context = kvResponse.content;
        console.log('[kvContent] Got context for story:', context.substring(0, 200) + '...');
      }
    }

    // Generate story with optional KV context
    const storyBody: any = {
      prompt,
      influencer_focus: influencerFocus,
      username,
      display_name: displayName,
    };

    // If we have context, pass it directly to the edge function
    if (context) {
      storyBody.kv_content = context;
      console.log('[kvContent] Passing KV content to story generator, length:', context.length);
    }

    const { data, error } = await supabase.functions.invoke('generate-story-post', {
      body: storyBody,
    });

    if (error) {
      throw error;
    }

    return {
      text: data.text,
      context,
    };
  } catch (error) {
    console.error('[kvContent] Failed to generate story with context:', error);
    throw error;
  }
}

/**
 * Example usage:
 * 
 * // Fetch raw content from KV store
 * const content = await fetchKVContent({
 *   url: 'https://myblog.com/travel-tips',
 *   extract: 'summary',
 * });
 * 
 * // Generate story with context from blog
 * const story = await generateStoryWithContext(
 *   'adventure travel',
 *   'travel',
 *   'https://myblog.com/travel-tips'
 * );
 */