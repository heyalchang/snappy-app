import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  PanResponder,
  Animated,
  LogBox,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Video, ResizeMode } from 'expo-av';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'StoryViewer'>;
type RouteTypeProp = RouteProp<RootStackParamList, 'StoryViewer'>;

interface Story {
  id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  caption?: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    avatar_emoji?: string;
    avatar_color?: string;
  };
  view_count?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Hide noisy dev-only warning originating from a dependency. Production builds
// don’t run LogBox, so this has zero runtime cost for end-users.
if (__DEV__) {
  LogBox.ignoreLogs(['useInsertionEffect must not schedule updates']);
}

export default function StoryViewerScreen() {
  // Navigation & route hooks
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteTypeProp>();

  // ------------------------------------------------------------------------
  // Safely exit the viewer. If there is no previous screen (canGoBack ===
  // false), fall back to the Stories tab so we never dispatch an unhandled
  // GO_BACK action.
  const safeGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Root navigator lacks a direct "Stories" screen;
      // switch to the Stories tab inside MainTabs instead.
      navigation.navigate('MainTabs' as never, { screen: 'Stories' } as never);
    }
  };
  const { userId, initialStoryIndex = 0 } = route.params;
  const { user } = useAuth();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  
  useEffect(() => {
    loadStories();
  }, [userId]);

  useEffect(() => {
    if (stories.length > 0 && currentIndex < stories.length) {
      startProgress();
      trackView();
    }
  }, [currentIndex, stories]);

  const loadStories = async () => {
    try {
      // Get all stories from this user
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          media_url,
          media_type,
          caption,
          created_at,
          author:profiles!posts_author_id_fkey(
            id, username, avatar_emoji, avatar_color
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // TODO: Get view counts if viewing own stories
      // Need to create post_viewers table first
      // if (user?.id === userId && data) {
      //   for (const story of data) {
      //     const { count } = await supabase
      //       .from('post_viewers')
      //       .select('*', { count: 'exact', head: true })
      //       .eq('post_id', story.id);
      //     
      //     story.view_count = count || 0;
      //   }
      // }

      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
      Alert.alert('Error', 'Failed to load stories');
      safeGoBack();
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    // TODO: Implement view tracking once post_viewers table is created
    // if (!user || currentIndex >= stories.length) return;
    // 
    // const story = stories[currentIndex];
    // if (story.author.id === user.id) return; // Don't track own views
    // 
    // try {
    //   await supabase
    //     .from('post_viewers')
    //     .upsert({
    //       post_id: story.id,
    //       viewer_id: user.id,
    //       viewed_at: new Date().toISOString(),
    //     }, {
    //       onConflict: 'post_id,viewer_id'
    //     });
    // } catch (error) {
    //   console.error('Error tracking view:', error);
    // }
  };

  const startProgress = () => {
    progressAnimation.setValue(0);
    
    const story = stories[currentIndex];
    const duration = story.media_type === 'video' ? 10000 : 5000; // 10s for video, 5s for photo
    
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start((finished) => {
      if (finished && !paused) {
        goToNext();
      }
    });
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      safeGoBack();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTap = (event: any) => {
    // Tap anywhere to advance to next story
    goToNext();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          safeGoBack();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  if (stories.length === 0) {
    safeGoBack();
    return null;
  }

  const currentStory = stories[currentIndex];
  const isOwnStory = currentStory.author.id === user?.id;

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.storyContainer}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            {stories.map((_, index) => (
              <View key={index} style={styles.progressBarWrapper}>
                <View style={styles.progressBarBackground} />
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: index === currentIndex 
                        ? progressAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : index < currentIndex ? '100%' : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: currentStory.author.avatar_color || '#FFB6C1' }
                ]}
              >
                <Text style={styles.avatarEmoji}>
                  {currentStory.author.avatar_emoji || '😎'}
                </Text>
              </View>
              <View>
                <Text style={styles.username}>{currentStory.author.username}</Text>
                <Text style={styles.timeAgo}>
                  {getTimeAgo(currentStory.created_at)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={safeGoBack}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Media Content */}
          {currentStory.media_type === 'photo' ? (
            <Image
              source={{ uri: currentStory.media_url }}
              style={styles.media}
              resizeMode="cover"
            />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: currentStory.media_url }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
            />
          )}

          {/* Caption */}
          {currentStory.caption && (
            <View style={styles.captionContainer}>
              <Text style={styles.caption}>{currentStory.caption}</Text>
            </View>
          )}

          {/* View Count (for own stories) */}
          {isOwnStory && (
            <View style={styles.viewCountContainer}>
              <Text style={styles.viewCount}>
                👁 {currentStory.view_count || 0} views
              </Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyContainer: {
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 8,
    right: 8,
    flexDirection: 'row',
    zIndex: 2,
  },
  progressBarWrapper: {
    flex: 1,
    height: 3,
    marginHorizontal: 2,
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  header: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  username: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  closeButton: {
    color: '#FFF',
    fontSize: 28,
    paddingHorizontal: 12,
  },
  media: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 8,
  },
  caption: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  viewCountContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewCount: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});