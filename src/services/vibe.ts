import { supabase } from './supabase';
import { VibeCheckRequest, VibeCheckResponse } from '@/types/vibe';

export async function runVibeCheck(
  payload: VibeCheckRequest
): Promise<VibeCheckResponse> {
  const { data, error } = await supabase.functions.invoke('vibe-check', {
    body: payload,
  });

  if (error) throw error;
  if (!data) throw new Error('Empty response from vibe-check');

  // Basic runtime validation.
  if (
    typeof data.tone !== 'string' ||
    typeof data.inferred_meaning !== 'string' ||
    typeof data.key_phrase !== 'string'
  ) {
    throw new Error('Invalid VibeCheck response shape');
  }

  return data as VibeCheckResponse;
}