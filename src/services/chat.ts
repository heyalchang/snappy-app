import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: number;
  room_id: string;
  sender_id: string;
  content: string | null;
  type: 'text' | 'photo' | 'video';
  media_url: string | null;
  created_at: string;
  read_at?: string | null;
  sender?: {
    username: string;
    avatar_emoji?: string | null;
    avatar_color?: string | null;
  };
}

export interface ChatRoom {
  roomId: string;
  otherUserId: string;
  otherUser?: {
    username: string;
    avatar_emoji?: string | null;
    avatar_color?: string | null;
  };
  lastMessage?: Message;
  unreadCount?: number;
}

// Generate deterministic room ID for direct messages
export function getRoomId(userId1: string, userId2: string): string {
  return `dm_${[userId1, userId2].sort().join('_')}`;
}

// Send a text message
export async function sendTextMessage(
  roomId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      content,
      type: 'text',
    })
    .select(`
      *,
      sender:profiles!sender_id (
        username,
        avatar_emoji,
        avatar_color
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

// Send a media message (photo or video)
export async function sendMediaMessage(
  roomId: string,
  senderId: string,
  mediaUrl: string,
  mediaType: 'photo' | 'video',
  caption?: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      content: caption || null,
      type: mediaType,
      media_url: mediaUrl,
    })
    .select(`
      *,
      sender:profiles!sender_id (
        username,
        avatar_emoji,
        avatar_color
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

// Get messages for a room
export async function getMessages(
  roomId: string,
  limit = 50
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id (
        username,
        avatar_emoji,
        avatar_color
      )
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Get chat rooms for a user
export async function getChatRooms(userId: string): Promise<ChatRoom[]> {
  // Get all messages where user is participant
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id (
        username,
        avatar_emoji,
        avatar_color
      )
    `)
    .or(`room_id.like.%${userId}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group messages by room and get latest
  const roomsMap = new Map<string, ChatRoom>();
  
  messages?.forEach(message => {
    if (!roomsMap.has(message.room_id)) {
      // Extract other user ID from room ID
      const userIds = message.room_id.replace('dm_', '').split('_');
      const otherUserId = userIds.find(id => id !== userId) || '';
      
      roomsMap.set(message.room_id, {
        roomId: message.room_id,
        otherUserId,
        lastMessage: message,
      });
    }
  });

  // Get other users' info
  const rooms = Array.from(roomsMap.values());
  const otherUserIds = rooms.map(room => room.otherUserId);
  
  if (otherUserIds.length > 0) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', otherUserIds);
    
    // Map user info to rooms
    users?.forEach(user => {
      const room = rooms.find(r => r.otherUserId === user.id);
      if (room) {
        room.otherUser = {
          username: user.username,
          avatar_emoji: null,
          avatar_color: null,
        };
      }
    });
  }

  return rooms;
}

// Mark messages as read
export async function markMessagesAsRead(
  roomId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

// Subscribe to new messages
export function subscribeToMessages(
  roomId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        // Fetch complete message with sender info
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!sender_id (
              username,
              avatar_emoji,
              avatar_color
            )
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (data) {
          onMessage(data);
        }
      }
    )
    .subscribe();

  return channel;
}

// Upload media to Supabase Storage
export async function uploadMedia(
  file: Blob,
  fileName: string,
  userId: string
): Promise<string> {
  const filePath = `${userId}/${Date.now()}_${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(filePath, file);

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  return publicUrl;
}