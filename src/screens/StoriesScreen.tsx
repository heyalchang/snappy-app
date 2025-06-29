import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal, // Added
  TextInput, // Added
  Image, // Added for Insta Story display
  Alert, // Added for error alerts
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { createInstaStory } from '../services/instaStory'; // Added

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StoryUser {
  id: string;
  username: string;
  avatar_emoji?: string;
  avatar_color?: string;
  latestStory?: {
    id: string;
    caption?: string;
    created_at: string;
  };
}

export default function StoriesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [friendsWithStories, setFriendsWithStories] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add state & handlers at top of component (after existing state declarations)
  const [instaVisible, setInstaVisible] = useState(false);
  const [instaKeyword, setInstaKeyword] = useState('');
  const [instaStage, setInstaStage] = useState<'idle' | 'prompt' | 'image'>('idle');
  const [instaUrl, setInstaUrl] = useState<string | null>(null);
  const [instaCaption, setInstaCaption] = useState<string>('');

  const startInstaFlow = () => {
    setInstaKeyword('');
    setInstaStage('idle');
    setInstaUrl(null);
    setInstaCaption('');
    setInstaVisible(true);
  };

  const runInstaGeneration = async () => {
    if (!instaKeyword.trim() || !user) return;
    try {
      setInstaStage('prompt');
      const { url, caption } = await createInstaStory(instaKeyword.trim(), {
        username: user.username,
        display_name: user.display_name,
        influencer_focus: (user as any).influencer_focus ?? null,
      });
      setInstaUrl(url);
      setInstaCaption(caption);
      setInstaStage('image');
    } catch (err) {
      console.error('[Stories] Insta Story error:', err);
      Alert.alert('Error', 'Could not generate Insta Story');
      setInstaStage('idle');
    }
  };

  const postInstaStory = async () => {
    if (!user || !instaUrl) return;
    try {
      await supabase.from('posts').insert({
        author_id: user.id,
        media_url: instaUrl,
        media_type: 'photo',
        caption: instaCaption,
      });
      setInstaVisible(false);
      // refresh list
      loadFriendsWithStories();
    } catch (err) {
      console.error('[Stories] Post story error:', err);
      Alert.alert('Error', 'Failed to post story');
    }
  };

  useEffect(() => {
    loadFriendsWithStories();
  }, [user]);

  const loadFriendsWithStories = async () => {
    if (!user) return;

    try {
      // Get friends
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      // Extract friend IDs
      const friendIds = friendships?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      // Also include the current user for "My Story"
      friendIds.push(user.id);

      // Get friends with their latest stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          created_at,
          author:profiles!posts_author_id_fkey(
            id, username, avatar_emoji, avatar_color
          )
        `)
        .in('author_id', friendIds)
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // Group by user and get latest story
      const userStoriesMap = new Map<string, StoryUser>();
      
      storiesData?.forEach(story => {
        if (story.author) {
          const userId = story.author.id;
          if (!userStoriesMap.has(userId)) {
            userStoriesMap.set(userId, {
              id: userId,
              username: story.author.username,
              avatar_emoji: story.author.avatar_emoji,
              avatar_color: story.author.avatar_color,
              latestStory: {
                id: story.id,
                caption: story.caption,
                created_at: story.created_at,
              },
            });
          }
        }
      });

      // Convert to array and sort (current user first)
      const storiesArray = Array.from(userStoriesMap.values());
      storiesArray.sort((a, b) => {
        if (a.id === user.id) return -1;
        if (b.id === user.id) return 1;
        return a.username.localeCompare(b.username);
      });

      setFriendsWithStories(storiesArray);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFriendsWithStories();
  };

  const renderStoryItem = ({ item }: { item: StoryUser }) => {
    const isCurrentUser = item.id === user?.id;
    
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => {
          navigation.navigate('StoryViewer', { userId: item.id });
        }}
      >
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
        <Text style={styles.username} numberOfLines={1}>
          {isCurrentUser ? 'My Story' : item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Stories</Text>
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
        <Text style={styles.title}>Stories</Text>
      </View>

      {friendsWithStories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyText}>No stories yet</Text>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.cameraButtonText}>Add to Story</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friendsWithStories}
          renderItem={renderStoryItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFC00"
            />
          }
          contentContainerStyle={styles.gridContent}
        />
      )}

      {/* Add Insta Story FAB just before closing root View */}
      <TouchableOpacity
        style={styles.instaFab}
        onPress={startInstaFlow}
      >
        <Text style={{ fontSize: 28, color: '#000' }}>📸</Text>
      </TouchableOpacity>

      {/* Add Modal JSX near end of return block (sibling to existing content) */}
      <Modal
        visible={instaVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInstaVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {instaStage === 'idle' && (
              <>
                <Text style={styles.modalTitle}>Insta Story Generator</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter word or phrase…"
                  placeholderTextColor="#666"
                  value={instaKeyword}
                  onChangeText={setInstaKeyword}
                />
                <TouchableOpacity
                  style={[
                    styles.generateBtn,
                    !instaKeyword.trim() && { opacity: 0.5 },
                  ]}
                  disabled={!instaKeyword.trim()}
                  onPress={runInstaGeneration}
                >
                  <Text style={styles.genBtnTxt}>Generate</Text>
                </TouchableOpacity>
              </>
            )}

            {instaStage !== 'idle' && (
              <>
                {instaStage === 'prompt' && (
                  <>
                    <ActivityIndicator color="#FFFC00" />
                    <Text style={styles.statusTxt}>Creating prompt…</Text>
                  </>
                )}

                {instaStage === 'image' && !instaUrl && (
                  <>
                    <ActivityIndicator color="#FFFC00" />
                    <Text style={styles.statusTxt}>Generating image…</Text>
                  </>
                )}

                {instaUrl && (
                  <>
                    <Image
                      source={{ uri: instaUrl }}
                      style={{ width: '100%', height: 300, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                    {instaCaption ? (
                      <Text style={styles.captionTxt}>{instaCaption}</Text>
                    ) : null}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => setInstaVisible(false)}
                      >
                        <Text style={styles.rejectTxt}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.postBtn}
                        onPress={postInstaStory}
                      >
                        <Text style={styles.postTxt}>Post</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
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
  cameraButton: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
  },
  cameraButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridContent: {
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  storyItem: {
    flex: 1,
    alignItems: 'center',
    margin: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#FFFC00',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  username: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  // Add styles at bottom
  instaFab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#FFFC00',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  generateBtn: {
    backgroundColor: '#FFFC00',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  genBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  statusTxt: { color: '#FFF', fontSize: 14, marginTop: 12 },
  captionTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  rejectBtn: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  postBtn: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#FFFC00',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  rejectTxt: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  postTxt: { color: '#000', fontSize: 15, fontWeight: '600' },
});