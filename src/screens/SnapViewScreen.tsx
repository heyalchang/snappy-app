import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';

type SnapViewNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SnapView'>;
type SnapViewRouteProp = RouteProp<RootStackParamList, 'SnapView'>;

interface SnapPost {
  id: string;
  author_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  caption: string | null;
  created_at: string;
}

export default function SnapViewScreen() {
  const navigation = useNavigation<SnapViewNavigationProp>();
  const route = useRoute<SnapViewRouteProp>();
  const { snapId } = route.params;
  const { user } = useAuth();
  
  const [snap, setSnap] = useState<SnapPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isViewing, setIsViewing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const viewStartTime = useRef<number>(0);

  // Initialize video player
  const player = useVideoPlayer(snap?.media_type === 'video' ? snap.media_url : null, player => {
    if (snap?.media_type === 'video') {
      player.loop = false;
      player.play();
    }
  });

  useEffect(() => {
    loadSnap();
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [snapId]);

  const loadSnap = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', snapId)
        .single();
      
      if (error || !data) {
        Alert.alert('Error', 'Snap not found');
        navigation.goBack();
        return;
      }

      setSnap(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading snap:', error);
      Alert.alert('Error', 'Failed to load snap');
      navigation.goBack();
    }
  };

  const startViewing = async () => {
    if (!snap || isViewing) return;
    
    setIsViewing(true);
    viewStartTime.current = Date.now();
    
    // Start countdown (10 seconds max for photos, video duration for videos)
    const duration = snap.media_type === 'photo' ? 10 : 10; // Both limited to 10s
    setCountdown(duration);
    
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          endViewing();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endViewing = async () => {
    if (!isViewing) return;
    
    setIsViewing(false);
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    
    // Delete the snap after viewing
    await deleteSnap();
    
    // Navigate back
    navigation.goBack();
  };

  const deleteSnap = async () => {
    if (!snap || !user) return;
    
    try {
      // Delete the post recipient entry (removes from inbox)
      const { error: recipientError } = await supabase
        .from('post_recipients')
        .delete()
        .eq('post_id', snap.id)
        .eq('recipient_id', user.id);

      if (recipientError) {
        console.error('Error deleting recipient:', recipientError);
      }

      // For self-sent snaps, also delete the post and media
      if (snap.author_id === user.id) {
        // Delete from storage
        const mediaPath = snap.media_url.split('/').pop();
        if (mediaPath) {
          const { error: storageError } = await supabase.storage
            .from('media')
            .remove([`snaps/${mediaPath}`]);
          
          if (storageError) {
            console.error('Error deleting media:', storageError);
          }
        }

        // Delete the post
        const { error: postError } = await supabase
          .from('posts')
          .delete()
          .eq('id', snap.id);

        if (postError) {
          console.error('Error deleting post:', postError);
        }
      }
    } catch (error) {
      console.error('Error deleting snap:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  if (!snap) {
    return null;
  }

  return (
    <TouchableWithoutFeedback
      onPressIn={startViewing}
      onPressOut={endViewing}
    >
      <View style={styles.container}>
        {!isViewing ? (
          <View style={styles.instructionContainer}>
            <Text style={styles.emoji}>👆</Text>
            <Text style={styles.instruction}>Tap and hold to view</Text>
            <Text style={styles.subInstruction}>
              {snap.media_type === 'photo' ? 'Photo' : 'Video'} from Me
            </Text>
          </View>
        ) : (
          <>
            {snap.media_type === 'photo' ? (
              <Image source={{ uri: snap.media_url }} style={styles.media} />
            ) : (
              <VideoView
                style={styles.media}
                player={player}
                contentFit="cover"
              />
            )}
            
            {/* Caption */}
            {snap.caption && (
              <View style={styles.captionContainer}>
                <Text style={styles.caption}>{snap.caption}</Text>
              </View>
            )}
            
            {/* Countdown */}
            <View style={styles.countdownContainer}>
              <Text style={styles.countdown}>{countdown}</Text>
            </View>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  instruction: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subInstruction: {
    color: '#AAA',
    fontSize: 16,
  },
  media: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  caption: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  countdownContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdown: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});