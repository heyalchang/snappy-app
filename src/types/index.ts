import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  username: string;
  displayName?: string;
  phoneNumber: string;
  profilePhotoUrl?: string;
  createdAt: Timestamp;
  friends: string[];
}

export interface Snap {
  snapId: string;
  creatorId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  recipients: string[] | 'story';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  viewedBy: Array<{uid: string; timestamp: Timestamp}>;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'snap' | 'media';
  content: string;
  sentAt: Timestamp;
  readAt?: Timestamp;
}