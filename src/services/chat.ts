import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Array of generic auto-responses
const AUTO_RESPONSES = [
  "Hey! 👋",
  "That's awesome!",
  "Good to hear from you!",
  "Cool! 😎",
  "Nice!",
  "Thanks for sharing!",
  "Interesting...",
  "LOL 😂",
  "For real?",
  "No way!",
  "That's what's up",
  "Bet",
  "Facts",
  "Love that for you",
  "Mood",
  "Same here",
  "I feel you",
  "Right?!",
  "Totally agree",
  "Miss you too!",
  "Let's hang soon!",
  "👍",
  "❤️",
  "🔥🔥🔥",
  "Haha yeah"
];

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

// Get a random auto-response
function getRandomResponse(): string {
  return AUTO_RESPONSES[Math.floor(Math.random() * AUTO_RESPONSES.length)];
}

// Send AI-generated auto-response after a delay
async function sendAutoResponse(roomId: string, senderId: string, recipientId: string, lastMessage: string) {
  // Wait 1-3 seconds for more natural feeling
  const delay = 1000 + Math.random() * 2000;
  
  setTimeout(async () => {
    try {
      // Get sender and recipient profiles
      const [senderProfile, recipientProfile] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, persona, age, messaging_goals')
          .eq('id', senderId)
          .single(),
        supabase
          .from('profiles')
          .select('username, persona, age, messaging_goals')
          .eq('id', recipientId)
          .single()
      ]);

      if (!senderProfile.data || !recipientProfile.data) {
        throw new Error('Could not fetch profiles');
      }

      // Get recent message history
      const { data: messages } = await supabase
        .from('messages')
        .select('sender_id, content, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(10);

      const messageThread = (messages || [])
        .reverse()
        .map(msg => ({
          sender: msg.sender_id === senderId ? senderProfile.data.username : recipientProfile.data.username,
          content: msg.content || '',
          timestamp: msg.created_at
        }));

      // Call edge function for AI response
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-chat-response', {
        body: {
          senderName: senderProfile.data.username,
          senderPersona: senderProfile.data.persona || 'A friendly person who likes to chat.',
          senderAge: senderProfile.data.age || 18,
          recipientName: recipientProfile.data.username,
          recipientPersona: recipientProfile.data.persona || 'A friendly person who likes to chat.',
          recipientAge: recipientProfile.data.age || 18,
          recipientGoals: recipientProfile.data.messaging_goals || 'Be friendly and engaging.',
          messageThread
        }
      });

      let response: string;
      if (aiError || !aiResponse?.response) {
        // Fallback to random response if AI fails
        response = getRandomResponse();
        console.log('AI failed, using fallback response:', response);
      } else {
        response = aiResponse.response;
        console.log('AI response:', response);
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: recipientId, // Friend sends the response
          recipient_id: senderId, // Back to original sender
          content: response,
          type: 'text',
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error sending auto-response:', error);
      } else {
        console.log('Auto-response sent successfully:', data);
      }
    } catch (error) {
      console.error('Error in auto-response:', error);
      // Try to send a fallback response
      const fallbackResponse = getRandomResponse();
      await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: recipientId,
          recipient_id: senderId,
          content: fallbackResponse,
          type: 'text',
        });
    }
  }, delay);
}

// Send a text message
export async function sendTextMessage(
  roomId: string,
  senderId: string,
  recipientId: string,
  content: string
): Promise<Message> {
  console.log('sendTextMessage called with:', { roomId, senderId, recipientId, content });
  
  const insertData = {
    room_id: roomId,
    sender_id: senderId,
    recipient_id: recipientId,
    content,
    type: 'text',
  };
  
  console.log('Attempting to insert:', insertData);
  
  const { data, error } = await supabase
    .from('messages')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }
  
  console.log('Message sent successfully:', data);
  
  // Fetch sender profile separately
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('username, avatar_emoji, avatar_color')
    .eq('id', senderId)
    .single();
  
  const messageWithSender = {
    ...data,
    sender: senderProfile
  };
  
  // Send auto-response from the friend
  sendAutoResponse(roomId, senderId, recipientId, content);
  
  return messageWithSender;
}

// Send a media message (photo or video)
export async function sendMediaMessage(
  roomId: string,
  senderId: string,
  recipientId: string,
  mediaUrl: string,
  mediaType: 'photo' | 'video',
  caption?: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      recipient_id: recipientId,
      content: caption || null,
      type: mediaType,
      media_url: mediaUrl,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Fetch sender profile separately
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('username, avatar_emoji, avatar_color')
    .eq('id', senderId)
    .single();
  
  const messageWithSender = {
    ...data,
    sender: senderProfile
  };
  
  // Send auto-response from the friend
  sendAutoResponse(roomId, senderId, recipientId, caption || `sent a ${mediaType}`);
  
  return messageWithSender;
}

// Get messages for a room
export async function getMessages(
  roomId: string,
  cursor?: string, // ISO timestamp
  limit = 20
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: messages, error } = await query;

  if (error) throw error;
  
  // Fetch sender profiles for all messages
  if (messages && messages.length > 0) {
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_emoji, avatar_color')
      .in('id', senderIds);
    
    // Create a map for quick lookup
    const profileMap = (profiles || []).reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {});
    
    // Attach sender info to messages
    const messagesWithSenders = messages.map(message => ({
      ...message,
      sender: profileMap[message.sender_id] || null
    }));
    
    return messagesWithSenders;
  }
  
  return [];
}

// Get chat rooms for a user
export async function getChatRooms(userId: string): Promise<ChatRoom[]> {
  const { data, error } = await supabase.rpc('get_chat_rooms', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }

  return data.map(room => ({
    roomId: room.roomId,
    otherUserId: room.otherUserId,
    lastMessage: room.lastMessage as Message,
    unreadCount: room.unreadCount,
    otherUser: {
      username: room.otherUser.username,
      avatar_emoji: room.otherUser.avatar_emoji,
      avatar_color: room.otherUser.avatar_color,
    },
  }));
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
        // Fetch complete message
        const { data: message } = await supabase
          .from('messages')
          .select('*')
          .eq('id', payload.new.id)
          .single();
        
        if (message) {
          // Fetch sender profile separately
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('username, avatar_emoji, avatar_color')
            .eq('id', message.sender_id)
            .single();
          
          const messageWithSender = {
            ...message,
            sender: senderProfile
          };
          
          onMessage(messageWithSender);
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