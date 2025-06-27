import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import {
  Message,
  getMessages,
  sendTextMessage,
  getRoomId,
  subscribeToMessages,
  markMessagesAsRead,
} from '../services/chat';
import { RealtimeChannel } from '@supabase/supabase-js';

type ChatScreenRouteProp = RouteProp<MainStackParamList, 'Chat'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { friendId, friendUsername } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const roomId = user ? getRoomId(user.id, friendId) : '';

  useEffect(() => {
    if (user) {
      setLoading(true);
      setMessages([]);
      loadMessages().then(() => {
        markAsRead();
        setupSubscription();
      });
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [user, friendId]);

  const loadMessages = async () => {
    try {
      const data = await getMessages(roomId);
      setMessages(data.reverse()); // Show oldest first
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!user) return;
    try {
      await markMessagesAsRead(roomId, user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const setupSubscription = () => {
    if (!user) return;

    channelRef.current = subscribeToMessages(roomId, (newMessage) => {
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
      if (newMessage.sender_id !== user.id) {
        markAsRead();
      }
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
  };

  const sendMessage = async () => {
    if (!user || !messageText.trim()) return;

    const trimmedMessage = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      console.log('Sending message with params:', {
        roomId,
        senderId: user.id,
        friendId,
        message: trimmedMessage
      });
      const sentMessage = await sendTextMessage(roomId, user.id, friendId, trimmedMessage);
      // Add the sent message to the chat immediately
      setMessages((prev) => [...prev, sentMessage]);
    } catch (error: any) {
      console.error('Error sending message - Full details:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      Alert.alert('Error', `Failed to send message: ${error?.message || 'Unknown error'}`);
      setMessageText(trimmedMessage);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.theirMessageRow,
        ]}
      >
        {!isMyMessage && (
          <View style={[styles.smallAvatar, { backgroundColor: '#FFB6C1' }]}>
            <Text style={styles.smallAvatarEmoji}>
              {item.sender?.avatar_emoji || '👤'}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}
        >
          {item.type === 'text' && (
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.content}
            </Text>
          )}
          {item.type === 'photo' && (
            <View>
              {item.media_url && (
                <Image 
                  source={{ uri: item.media_url }} 
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              )}
              {item.content && (
                <Text style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.theirMessageText,
                  styles.mediaCaption
                ]}>
                  {item.content}
                </Text>
              )}
            </View>
          )}
          {item.type === 'video' && (
            <View>
              <Text style={styles.mediaMessage}>🎥 Video</Text>
              {item.content && (
                <Text style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.theirMessageText,
                ]}>
                  {item.content}
                </Text>
              )}
            </View>
          )}
          <Text
            style={[
              styles.timestamp,
              isMyMessage ? styles.myTimestamp : styles.theirTimestamp,
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{friendUsername}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start the conversation with {friendUsername}!
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={() => {
            // Navigate to camera with chat context
            navigation.navigate('Camera', {
              chatContext: { friendId, friendUsername }
            } as any);
          }}
        >
          <Text style={styles.cameraIcon}>📸</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#FFF',
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: '#FFF',
    fontSize: 24,
  },
  messagesList: {
    padding: 20,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  smallAvatarEmoji: {
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#FFFC00',
  },
  theirMessage: {
    backgroundColor: '#333',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#000',
  },
  theirMessageText: {
    color: '#FFF',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  mediaCaption: {
    marginTop: 4,
  },
  mediaMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  myTimestamp: {
    color: '#666',
  },
  theirTimestamp: {
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#222',
    alignItems: 'flex-end',
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cameraIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    color: '#FFF',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  sendButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});