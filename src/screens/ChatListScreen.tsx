import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { getChatRooms, ChatRoom } from '../services/chat';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function ChatListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadChatRooms = useCallback(async () => {
    // If the user object isn’t ready, immediately clear the loading states
    // so the spinner doesn’t hang forever. The hook will run again once the
    // Auth context provides a user.
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const rooms = await getChatRooms(user.id);
      setChatRooms(rooms);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      // Load chat rooms when screen comes into focus, but don't show spinner
      loadChatRooms();
    }, [loadChatRooms])
  );

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-list-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Chat list change received!', payload);
          loadChatRooms();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, loadChatRooms]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChatRooms();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const lastMessageText = item.lastMessage?.content || 
      (item.lastMessage?.type === 'photo' ? '📷 Photo' : 
       item.lastMessage?.type === 'video' ? '🎥 Video' : 
       'No messages yet');

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { 
          friendId: item.otherUserId,
          friendUsername: item.otherUser?.username || 'Unknown'
        })}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('UserProfile', { userId: item.otherUserId })}
        >
          <View style={[
            styles.avatar,
            { backgroundColor: item.otherUser?.avatar_color || '#FFB6C1' }
          ]}>
            <Text style={styles.avatarEmoji}>
              {item.otherUser?.avatar_emoji || '👤'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.chatInfo}>
          <Text style={styles.username}>
            {item.otherUser?.username || 'Unknown User'}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessageText}
          </Text>
        </View>

        <View style={styles.chatMeta}>
          {item.lastMessage && (
            <Text style={styles.timestamp}>
              {formatTime(item.lastMessage.created_at)}
            </Text>
          )}
          {item.unreadCount && item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
      </View>

      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.roomId}
        renderItem={renderChatRoom}
        contentContainerStyle={chatRooms.length === 0 && styles.emptyContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFC00"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation with your friends!
            </Text>
          </View>
        }
      />
    </View>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  chatInfo: {
    flex: 1,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#FFFC00',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});