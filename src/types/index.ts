import { Timestamp } from 'firebase/firestore';

export interface User {
  username: string;
  password: string; // For MVP only, would be hashed in production
  displayName?: string;
  profilePhotoUrl?: string;
  createdAt: Timestamp;
  friends: string[]; // Array of usernames
}

export interface Snap {
  snapId: string;
  creatorId: string; // username of creator
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  recipients: string[] | 'story'; // array of usernames or 'story'
  createdAt: Timestamp;
  expiresAt: Timestamp;
  viewedBy: Array<{username: string; timestamp: Timestamp}>;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string; // username of sender
  type: 'text' | 'snap' | 'media';
  content: string;
  sentAt: Timestamp;
  readAt?: Timestamp;
}