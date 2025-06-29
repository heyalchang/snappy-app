import { supabase } from './supabase';
import {
  ReplySuggestionRequest,
  ReplySuggestionResponse,
} from '@/types/reply';

/**
 * Call the edge-function and return three suggestions.
 * Throws on any error / invalid response.
 */
export async function fetchReplySuggestions(
  payload: ReplySuggestionRequest,
): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke(
    'generate-reply-options',
    { body: payload },
  );

  if (error) throw error;
  if (!data || !Array.isArray(data.suggestions)) {
    throw new Error('Invalid suggestions payload');
  }

  return (data as ReplySuggestionResponse).suggestions;
}