// Legacy types - kept for reference but not actively used
// The app now uses types from database.ts for Supabase integration

export interface User {
  username: string;
  password: string; // For MVP only, would be hashed in production
  displayName?: string;
  profilePhotoUrl?: string;
  createdAt: string; // ISO timestamp
  friends: string[]; // Array of usernames
}

export interface Snap {
  snapId: string;
  creatorId: string; // username of creator
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  recipients: string[] | 'story'; // array of usernames or 'story'
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
  viewedBy: Array<{username: string; timestamp: string}>;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string; // username of sender
  type: 'text' | 'snap' | 'media';
  content: string;
  sentAt: string; // ISO timestamp
  readAt?: string; // ISO timestamp
}