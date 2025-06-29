export type Strategy =
  | 'STRATEGY_PROJECT_CONFIDENCE'
  | 'STRATEGY_ASSESS_COMPATIBILITY'
  | 'STRATEGY_KEEP_CASUAL';

export interface ReplySuggestionRequest {
  draft_text: string;
  conversation_history: Array<{ sender: 'ME' | 'FRIEND'; text: string }>;
  self_profile: {
    username: string;
    age?: number | null;
    persona?: string | null;
    messaging_goals?: string | null;
  };
  friend_profile: {
    username: string;
    age?: number | null;
    persona?: string | null;
    messaging_goals?: string | null;
  };
  strategy: Strategy;
}

export interface ReplySuggestionResponse {
  suggestions: string[];
}