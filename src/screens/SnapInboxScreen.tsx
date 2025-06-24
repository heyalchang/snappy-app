import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';

type SnapInboxNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface SnapPost {
  id: string;
  author_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  caption: string | null;
  created_at: string;
  author?: {
    username: string;
  };
}

export default function SnapInboxScreen() {
  const navigation = useNavigation<SnapInboxNavigationProp>();
  const { user } = useAuth();
  const [snaps, setSnaps] = useState<SnapPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSnaps = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get posts sent to this user
      const { data: postRecipients, error: recipientError } = await supabase
        .from('post_recipients')
        .select('post_id')
        .eq('recipient_id', user.id);

      if (recipientError) throw recipientError;

      if (!postRecipients || postRecipients.length === 0) {
        setSnaps([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get the actual posts
      const postIds = postRecipients.map(pr => pr.post_id);
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!author_id(username)
        `)
        .in('id', postIds)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      setSnaps(posts || []);
    } catch (error) {
      console.error('Error loading snaps:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSnaps();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSnaps();
  };

  const renderSnapItem = ({ item }: { item: SnapPost }) => {
    const isFromSelf = item.author_id === user?.id;
    const senderName = item.author?.username || 'Unknown';
    
    return (
      <TouchableOpacity
        style={styles.snapItem}
        onPress={() => navigation.navigate('SnapView', { snapId: item.id })}
      >
        <View style={styles.snapInfo}>
          <Text style={styles.snapSender}>
            {isFromSelf ? 'Me (Test)' : senderName}
          </Text>
          <Text style={styles.snapType}>
            {item.media_type === 'photo' ? '📷' : '🎥'} {item.media_type}
            {item.caption && ` • ${item.caption}`}
          </Text>
        </View>
        <Text style={styles.tapToView}>Tap to view</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Snap Inbox</Text>
      
      {snaps.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No new snaps</Text>
          <Text style={styles.emptySubtext}>
            Send yourself a snap from the camera!
          </Text>
        </View>
      ) : (
        <FlatList
          data={snaps}
          keyExtractor={(item) => item.id}
          renderItem={renderSnapItem}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  snapItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapInfo: {
    flex: 1,
  },
  snapSender: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  snapType: {
    color: '#AAA',
    fontSize: 14,
  },
  tapToView: {
    color: '#FFFC00',
    fontSize: 14,
    fontWeight: '600',
  },
});