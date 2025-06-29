import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Image,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { createInstaStory } from '../services/instaStory';

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
  const [selectedModel, setSelectedModel] = useState('imagen-3.0-generate-002');
  // LLM provider selector (OpenAI = GPT / Gemini = Google)
  const [llmProvider, setLlmProvider] = useState<'openai' | 'gemini'>('openai');

  // 🟡 1️⃣ STATE & CONSTANTS ────────────────────────────────────────────────────
  // Pool of fun status messages shown while we wait for AI
  const PITHY_MESSAGES = [
    '✨ Mixing a dash of magic…',
    '🎨 Picking the perfect palette…',
    '🌴 Finding island vibes…',
    '🚀 Warming up the rockets…',
    '🦄 Polishing the unicorn dust…',
    '🔥 Stoking creative flames…',
    '🎯 Zeroing in on awesomeness…',
    '💡 Sparking fresh ideas…',
    '📸 Adjusting camera angles…',
    '🎉 Throwing confetti…',
    '🍹 Shaking a story cocktail…',
    '🌟 Aligning the stars…',
    '🏝️ Booking tropical flights…',
    '📝 Crafting catchy captions…',
    '🕶️ Adding extra coolness…'
  ];

  const [pithyIdx, setPithyIdx] = useState(0);
  const pithyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 30 inspirational starter phrases for the ✨ button
  const RANDOM_PROMPTS = [
    'Feel the burn',
    'Win the day',
    'Own your journey',
    'Chase the sun',
    'Dream bigger',
    'Live loud',
    'Stay wild',
    'Find your fire',
    'Rule the road',
    'Rise & shine',
    'Stay golden',
    'Dare to soar',
    'Make waves',
    'Keep it chic',
    'Fuel the hustle',
    'Glow up',
    'Fresh vibes',
    'Stay curious',
    'Run the world',
    'Create magic',
    'Level up',
    'Just breathe',
    'Be fearless',
    'Good energy',
    'Move with purpose',
    'Stay humble',
    'Own the moment',
    'Spark joy',
    'Live limitless',
    'Stay hungry',
  ];

  const insertRandomPrompt = () => {
    const pick =
      RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    setInstaKeyword(pick);
  };

  const startInstaFlow = () => {
    setInstaKeyword('');
    setSelectedModel('imagen-3.0-generate-002');
    setLlmProvider('openai');      // reset to default provider
    setInstaStage('idle');
    setInstaUrl(null);
    setInstaCaption('');
    setInstaVisible(true);
    // Pick a random starting point so the message sequence feels fresh each run
    const randomStart = Math.floor(Math.random() * PITHY_MESSAGES.length);
    setPithyIdx(randomStart);
  };

const runInstaGeneration = async () => {
  if (!instaKeyword.trim() || !user) return;

  // 1️⃣ Enter prompt-building stage
  setInstaStage('prompt');

  try {
    const { url, caption } = await createInstaStory(
      instaKeyword.trim(),
      {
        username: user.username,
        display_name: user.display_name,
        influencer_focus: (user as any).influencer_focus ?? null,
      },
      selectedModel,
      llmProvider,     // forward user-selected provider
    );

    // 2️⃣ Persist results
    setInstaUrl(url);
    setInstaCaption(caption);

    // 3️⃣ Move to image stage
    setInstaStage('image');
    console.log('[Stories] Insta stage → image');
  } catch (err) {
    console.error('[Stories] Insta Story error:', err);
    Alert.alert('Error', 'Could not generate Insta Story');
    setInstaStage('idle');
  } finally {
    // Safety net: make sure we never stay on "prompt"
    setInstaStage((prev) => (prev === 'prompt' ? 'idle' : prev));
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

  // 🟡 2️⃣ EFFECT TO ROTATE PITHY MESSAGES ──────────────────────────────────────
  useEffect(() => {
    // Determine if we are in a "waiting" state
    const waiting = instaStage === 'prompt' || (instaStage === 'image' && !instaUrl);

    if (waiting) {
      // Kick off an interval if none exists
      if (!pithyTimerRef.current) {
        pithyTimerRef.current = setInterval(() => {
          setPithyIdx((prev) => (prev + 1) % PITHY_MESSAGES.length);
        }, 3000 + Math.random() * 1000); // 3-4 s
      }
    } else {
      // Clear any existing timer once we're done waiting
      if (pithyTimerRef.current) {
        clearInterval(pithyTimerRef.current);
        pithyTimerRef.current = null;
      }
      // Reset message for next run
      setPithyIdx(0);
    }

    // Cleanup on unmount
    return () => {
      if (pithyTimerRef.current) {
        clearInterval(pithyTimerRef.current);
        pithyTimerRef.current = null;
      }
    };
  }, [instaStage, instaUrl]);


  const loadFriendsWithStories = async () => {
    if (!user) return;

    try {
      // Get friends -------------------------------------------------------
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      // ---------- Extract unique friend IDs (other party) -------------
      const friendIdSet = new Set<string>();
      friendships?.forEach((f) => {
        if (f.user_id === user.id) {
          friendIdSet.add(f.friend_id);
        } else {
          friendIdSet.add(f.user_id);
        }
      });

      // Always include *self* so "My Story" shows up even with no friends
      friendIdSet.add(user.id);

      const friendIds = Array.from(friendIdSet);

      // Fetch latest posts ----------------------------------------------
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

      // Group by user and keep only latest story ------------------------
      const userStoriesMap = new Map<string, StoryUser>();

      storiesData?.forEach((story) => {
        if (!story.author) {
          // Defensive: log and skip if author join returned null
          console.warn('[Stories] Skipping story with null author', story.id);
          return;
        }

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
      });

      // Convert to array and sort (current user first) ------------------
      const storiesArray = Array.from(userStoriesMap.values());
      storiesArray.sort((a, b) => {
        if (a.id === user.id) return -1;
        if (b.id === user.id) return 1;
        return a.username.localeCompare(b.username);
      });

      setFriendsWithStories(storiesArray);
    } catch (error) {
      console.error('[Stories] Error loading stories:', error);
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

      <Modal
        visible={instaVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInstaVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setInstaVisible(false)}>
          <View style={styles.modalOverlay}>
            {/* inner box – stop propagation */}
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                {instaStage === 'idle' && (
                  <>
                    <Text style={styles.modalTitle}>Insta Story Generator</Text>

                    {/* Input + sparkle */}
                    <View style={styles.inputRow}>
                      <TouchableOpacity
                        style={styles.sparkleBtn}
                        onPress={insertRandomPrompt}
                      >
                        <Text style={{ fontSize: 18 }}>✨</Text>
                      </TouchableOpacity>

                      <TextInput
                        style={[styles.modalInput, { flex: 1 }]}
                        placeholder="Enter word or phrase…"
                        placeholderTextColor="#666"
                        value={instaKeyword}
                        onChangeText={setInstaKeyword}
                      />
                    </View>

                    {/* Segmented model selector */}
                    <View style={styles.modelSegment}>
                      {[
                        { label: 'Default', value: 'imagen-3.0-generate-002' },
                        { label: 'Imagen4', value: 'imagen-4.0-generate-preview-06-06' },
                        { label: 'Ultra',   value: 'imagen-4.0-ultra-generate-preview-06-06' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.modelOption,
                            selectedModel === opt.value && styles.modelOptionActive,
                          ]}
                          onPress={() => setSelectedModel(opt.value)}
                        >
                          <Text
                            style={[
                              styles.modelOptionText,
                              selectedModel === opt.value && styles.modelOptionTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* LLM provider selector */}
                    <View style={styles.modelSegment}>
                      {[
                        { label: 'OpenAI', value: 'openai' },
                        { label: 'Gemini', value: 'gemini' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.modelOption,
                            llmProvider === opt.value && styles.modelOptionActive,
                          ]}
                          onPress={() => setLlmProvider(opt.value as 'openai' | 'gemini')}
                        >
                          <Text
                            style={[
                              styles.modelOptionText,
                              llmProvider === opt.value && styles.modelOptionTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

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
                    {/* Waiting states ------------------------------------------------------------ */}
                    {instaStage === 'prompt' && (
                      <View style={styles.waitingBox}>
                        <ActivityIndicator color="#FFFC00" size="large" />
                        <Text style={styles.waitingTxt}>{PITHY_MESSAGES[pithyIdx]}</Text>
                      </View>
                    )}

                    {instaStage === 'image' && !instaUrl && (
                      <View style={styles.waitingBox}>
                        <ActivityIndicator color="#FFFC00" size="large" />
                        <Text style={styles.waitingTxt}>{PITHY_MESSAGES[pithyIdx]}</Text>
                      </View>
                    )}

                    {instaUrl && (
                      <>
                        <Image
                          source={{ uri: instaUrl }}
                          style={{ width: '100%', aspectRatio: 9 / 16, borderRadius: 12 }}
                          resizeMode="cover"
                        />
                        {instaCaption ? (
                          <Text style={styles.captionTxt}>{instaCaption}</Text>
                        ) : null}

                        {/* Action buttons */}
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => setInstaVisible(false)}
                          >
                            <Text style={styles.rejectTxt}>Reject</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.regenBtn}
                            onPress={runInstaGeneration}
                          >
                            <Text style={styles.regenTxt}>Again</Text>
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
  pickerWrapper: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 16,
  },
  picker: { color: '#FFF' },
  modelLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  modelSegment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  modelOption: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#555',
    alignItems: 'center',
  },
  modelOptionActive: {
    backgroundColor: '#FFFC00',
    borderColor: '#FFFC00',
  },
  modelOptionText: {
    color: '#FFF',
  },
  modelOptionTextActive: {
    color: '#000',
  },
  regenBtn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#555',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  regenTxt: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sparkleBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  waitingTxt: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});