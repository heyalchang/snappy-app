import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../Navigation';

type Nav = NavigationProp<RootStackParamList, 'Camera'>;

/**
 * Stable Camera implementation using Expo-Camera’s CameraView.
 * – Tap  : capture photo
 * – Hold : record video (max 10 s)
 */
export default function CameraScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const chatContext = (route.params as any)?.chatContext ?? null;

  // Permissions --------------------------------------------------------------
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const [checkingPerms, setCheckingPerms] = useState(true);

  // Camera refs / state ------------------------------------------------------
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function ensurePerms() {
      if (!camPerm?.granted) await requestCamPerm();
      if (!micPerm?.granted) await requestMicPerm();
      setCheckingPerms(false);
    }
    ensurePerms();
  }, [camPerm, micPerm]);

  if (checkingPerms) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFFC00" size="large" />
        <Text style={styles.label}>Requesting permissions…</Text>
      </View>
    );
  }

  if (!camPerm?.granted || !micPerm?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.label}>Camera & mic permission required.</Text>
        <TouchableOpacity
          style={styles.yellowBtn}
          onPress={() => {
            requestCamPerm();
            requestMicPerm();
          }}
        >
          <Text style={styles.btnText}>Grant access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helpers ------------------------------------------------------------------
  const navigateToPreview = (uri: string, type: 'photo' | 'video') => {
    navigation.navigate('SnapPreview', {
      mediaUri: uri,
      mediaType: type,
      filterType: 'none',
      chatContext,
    });
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (!photo) {
        console.error('Failed to take picture');
        return;
      }
      navigateToPreview(photo.uri, 'photo');
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        
        // Set timeout to 15s (like palmer-test) instead of 10s
        recordingTimeoutRef.current = setTimeout(() => {
          console.log('Recording timeout - forcing stop');
          setIsRecording(false);
          if (cameraRef.current) {
            cameraRef.current.stopRecording();
          }
        }, 15000);

        const video = await cameraRef.current.recordAsync({
          maxDuration: 10,
        });
        
        // Clear timeout if recording completes
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
        }
        
        if (video && video.uri) {
          navigateToPreview(video.uri, 'video');
        }
      } catch (error) {
        console.error('Recording error:', error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  // UI -----------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
        videoQuality="720p"
      />

      {/* Top controls */}
      <View style={styles.topRow}>
        <TouchableOpacity 
          style={styles.ctrlBtn}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
        >
          <Text style={styles.ctrlTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomRow}>
        {/* Stories button removed */}

        <Pressable
          onPress={takePicture}
          onLongPress={startRecording}
          onPressOut={() => {
            if (isRecording) {
              stopRecording();
            }
          }}
          style={({ pressed }) => [
            styles.shutter,
            pressed && !isRecording && styles.shutterPressed,
            isRecording && styles.shutterRecording,
          ]}
        >
          <View style={[styles.shutterInner, isRecording && styles.shutterInnerRec]} />
        </Pressable>

        <TouchableOpacity
          style={styles.flipBtn}
          onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
        >
          <Text style={[styles.ctrlTxt, { opacity: 0.85, transform: [{ rotate: '-90deg' }] }]}>🔃</Text>
        </TouchableOpacity>
      </View>

      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recPill}>
          <View style={styles.recDot} />
          <Text style={styles.recTxt}>Recording…</Text>
        </View>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Stylesheet                                  */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  label: { color: '#fff', marginTop: 15, fontSize: 16 },
  yellowBtn: {
    marginTop: 20,
    backgroundColor: '#FFFC00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  btnText: { fontWeight: 'bold', fontSize: 16 },
  topRow: {
    position: 'absolute',
    top: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  ctrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlTxt: { color: '#fff', fontSize: 22 },
  bottomRow: {
    position: 'absolute',
    bottom: 80,              // raised higher
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center', // shutter centred
    alignItems: 'center',
  },
  smallTxt: { color: '#fff', fontSize: 16 },
  shutter: {
    width: 100,              // 25 % larger
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterPressed: { opacity: 0.7 },
  shutterRecording: { borderColor: '#FF0000' },
  shutterInner: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#fff'
  },
  shutterInnerRec: { backgroundColor: '#FF0000' },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recTxt: { color: '#fff', fontWeight: '600' },
  flipBtn: {
    position: 'absolute',
    right: 40,
    bottom: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});