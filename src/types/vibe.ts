/**
 * Shared contracts for the Vibe Check feature.
 * Keep in sync with the Edge-function implementation.
 */
export interface VibeCheckRequest {
  focalMessage: {
    id: number;
    sender: 'ME' | 'FRIEND';
    text: string;
  };
  history: Array<{
    sender: 'ME' | 'FRIEND';
    text: string;
  }>;
  senderProfile: {
    username: string;
    persona?: string | null;
    age?: number | null;
    messaging_goals?: string | null;
  };
  recipientProfile: {
    username: string;
    persona?: string | null;
    age?: number | null;
    messaging_goals?: string | null;
  };
}

export interface VibeCheckResponse {
  tone: string;              // e.g. "Casual & Flirty"
  inferred_meaning: string;  // one concise sentence
  key_phrase: string;        // strongest phrase trigger
}