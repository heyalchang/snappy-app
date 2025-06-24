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
import { doc, getDoc, updateDoc, arrayUnion, Timestamp, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { getAuth, getDb, getStorage } from '../services/firebase';
import { Snap } from '../types';
import { RootStackParamList } from '../Navigation';

type SnapViewNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SnapView'>;
type SnapViewRouteProp = RouteProp<RootStackParamList, 'SnapView'>;

export default function SnapViewScreen() {
  const navigation = useNavigation<SnapViewNavigationProp>();
  const route = useRoute<SnapViewRouteProp>();
  const { snapId } = route.params;
  
  const [snap, setSnap] = useState<Snap | null>(null);
  const [loading, setLoading] = useState(true);
  const [isViewing, setIsViewing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const viewStartTime = useRef<number>(0);

  // Initialize video player
  const player = useVideoPlayer(snap?.mediaType === 'video' ? snap.mediaUrl : null, player => {
    if (snap?.mediaType === 'video') {
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
      const db = getDb();
      const snapDoc = await getDoc(doc(db, 'snaps', snapId));
      
      if (!snapDoc.exists()) {
        Alert.alert('Error', 'Snap not found');
        navigation.goBack();
        return;
      }

      const snapData = snapDoc.data() as Snap;
      setSnap(snapData);
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
    
    // Mark as viewed
    await markAsViewed();
    
    // Start countdown (10 seconds max for photos, video duration for videos)
    const duration = snap.mediaType === 'photo' ? 10 : 10; // Both limited to 10s
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

  const markAsViewed = async () => {
    try {
      const auth = getAuth();
      const db = getDb();
      const userId = auth.currentUser?.uid;
      
      if (!userId) return;

      await updateDoc(doc(db, 'snaps', snapId), {
        viewedBy: arrayUnion({
          uid: userId,
          timestamp: Timestamp.now()
        })
      });
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
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
    if (!snap) return;
    
    try {
      const db = getDb();
      const storage = getStorage();
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      // Only delete if user has viewed it (for self-sent snaps)
      const isViewed = snap.viewedBy.some(view => view.uid === userId);
      if (!isViewed) return;
      
      // Delete from Storage
      try {
        const storageRef = ref(storage, snap.mediaUrl);
        await deleteObject(storageRef);
      } catch (error) {
        console.error('Error deleting media:', error);
        // Continue even if storage deletion fails
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'snaps', snapId));
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
              {snap.mediaType === 'photo' ? 'Photo' : 'Video'} from Me
            </Text>
          </View>
        ) : (
          <>
            {snap.mediaType === 'photo' ? (
              <Image source={{ uri: snap.mediaUrl }} style={styles.media} />
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