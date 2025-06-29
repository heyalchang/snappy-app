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
  const [flash, setFlash] = useState<'off' | 'on'>('off');
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

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      if (photo?.uri) navigateToPreview(photo.uri, 'photo');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not take photo.');
    }
  };

  const startVideo = async () => {
    if (isRecording) return;
    setIsRecording(true);

    // Safety timeout (10 s max)
    const to = setTimeout(() => stopVideo(), 10_000);
    recordingTimeoutRef.current = to;

    try {
      const video = await cameraRef.current?.recordAsync({
        maxDuration: 10,
        quality: '720p',
      });
      if (video?.uri) navigateToPreview(video.uri, 'video');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not record video.');
    } finally {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      setIsRecording(false);
    }
  };

  const stopVideo = () => {
    if (!isRecording) return;
    cameraRef.current?.stopRecording();
  };

  // UI -----------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
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

        <TouchableOpacity 
          style={styles.ctrlBtn}
          onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
        >
          <Text style={styles.ctrlTxt}>{flash === 'off' ? '⚡' : '⚡️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Stories')}>
          <Text style={styles.smallTxt}>Stories</Text>
        </TouchableOpacity>

        <Pressable
          onPress={takePhoto}
          onLongPress={startVideo}
          onPressOut={stopVideo}
          style={({ pressed }) => [
            styles.shutter,
            pressed && !isRecording && styles.shutterPressed,
            isRecording && styles.shutterRecording,
          ]}
        >
          <View style={[styles.shutterInner, isRecording && styles.shutterInnerRec]} />
        </Pressable>

        <TouchableOpacity onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
          <Text style={styles.ctrlTxt}>🔄</Text>
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
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  smallTxt: { color: '#fff', fontSize: 16 },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterPressed: { opacity: 0.7 },
  shutterRecording: { borderColor: '#FF0000' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
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
});