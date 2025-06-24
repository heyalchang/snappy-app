import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<MainStackParamList, 'Friends'>;

interface Friend {
  id: string;
  username: string;
  display_name?: string;
  avatar_emoji?: string;
  avatar_color?: string;
  snap_score: number;
}

export default function FriendsListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFriends();
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;

    try {
      // Get all friendships for current user
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          user_id,
          friend_id,
          user:profiles!friendships_user_id_fkey(
            id, username, display_name, avatar_emoji, avatar_color, snap_score
          ),
          friend:profiles!friendships_friend_id_fkey(
            id, username, display_name, avatar_emoji, avatar_color, snap_score
          )
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // Extract friend profiles
      const friendProfiles: Friend[] = [];
      friendships?.forEach((friendship) => {
        if (friendship.user_id === user.id && friendship.friend) {
          friendProfiles.push(friendship.friend as Friend);
        } else if (friendship.friend_id === user.id && friendship.user) {
          friendProfiles.push(friendship.user as Friend);
        }
      });

      // Sort by username
      friendProfiles.sort((a, b) => a.username.localeCompare(b.username));
      
      setFriends(friendProfiles);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFriends();
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => {
        // TODO: Navigate to chat with friend
        console.log('Chat with:', item.username);
      }}
    >
      <View style={styles.friendInfo}>
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: item.avatar_color || '#FFB6C1' }
          ]}
        >
          <Text style={styles.avatarEmoji}>
            {item.avatar_emoji || '😎'}
          </Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendUsername}>@{item.username}</Text>
          {item.display_name && item.display_name !== item.username && (
            <Text style={styles.friendDisplayName}>{item.display_name}</Text>
          )}
        </View>
      </View>
      <Text style={styles.snapScore}>
        {item.snap_score || 0} 🔥
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Friends</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFC00" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Friends</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>No friends yet</Text>
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={() => navigation.navigate('AddFriend')}
          >
            <Text style={styles.addFriendButtonText}>Add Friends</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFC00"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFC00',
    fontSize: 28,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    marginBottom: 30,
  },
  addFriendButton: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
  },
  addFriendButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    paddingVertical: 10,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  friendDetails: {
    flex: 1,
  },
  friendUsername: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendDisplayName: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  snapScore: {
    color: '#FFFC00',
    fontSize: 14,
    fontWeight: '600',
  },
});