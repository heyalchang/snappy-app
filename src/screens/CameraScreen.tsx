import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../Navigation';
import FilterCarousel from '../components/FilterCarousel';
import { FilterType } from '../utils/filters';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

// Get filter overlay style for visual feedback
const getFilterOverlayStyle = (filter: FilterType): any => {
  switch (filter) {
    case 'blackwhite':
      return { backgroundColor: 'rgba(0, 0, 0, 0.1)' };
    case 'sepia':
      return { backgroundColor: 'rgba(112, 66, 20, 0.15)' };
    case 'vintage':
      return { backgroundColor: 'rgba(150, 100, 50, 0.12)' };
    case 'face':
      return {};
    default:
      return {};
  }
};

export default function CameraScreen() {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const cameraRef = useRef<CameraView | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  const flipCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync();
      console.log('Picture taken:', photo);
      
      if (photo && photo.uri) {
        navigation.navigate('SnapPreview', { 
          mediaUri: photo.uri, 
          mediaType: 'photo',
          filterType: selectedFilter
        });
      }
    } catch (error) {
      console.error('Photo error:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    // Check microphone permission
    if (!micPermission?.granted) {
      Alert.alert('Permission Required', 'Microphone permission is required for video recording');
      return;
    }

    try {
      console.log('Starting recording...');
      setIsRecording(true);
      
      // Set a timeout to recover from stuck recordings
      recordingTimeoutRef.current = setTimeout(() => {
        console.log('Recording timeout - forcing stop');
        // Force stop the recording to ensure promise resolves
        if (cameraRef.current && isRecording) {
          cameraRef.current.stopRecording();
        }
        setIsRecording(false);
        Alert.alert('Recording Error', 'Recording timed out. Please try again.');
      }, 15000); // 15 second timeout

      const video = await cameraRef.current.recordAsync({
        maxDuration: 10,
      });
      
      // Clear timeout if recording completes normally
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      
      console.log('Recording completed:', video);
      setIsRecording(false);
      
      if (video && video.uri) {
        navigation.navigate('SnapPreview', { 
          mediaUri: video.uri, 
          mediaType: 'video',
          filterType: selectedFilter
        });
      }
    } catch (error: any) {
      console.error('Recording error:', error);
      
      // Clear timeout on error
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      
      setIsRecording(false);
      
      // Don't show alert if user manually stopped recording
      if (error.message !== 'Recording was stopped') {
        Alert.alert('Recording Error', 'Failed to record video');
      }
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const handleCapturePress = () => {
    console.log('Capture press, isRecording:', isRecording);
    if (!isRecording) {
      takePicture();
    }
  };

  const handleCaptureLongPress = () => {
    console.log('Long press detected');
    startRecording();
  };

  const handleCaptureRelease = () => {
    console.log('Capture release, isRecording:', isRecording);
    if (isRecording) {
      stopRecording();
    }
  };

  // Check if permissions are still loading
  if (cameraPermission === null || micPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Loading permissions...</Text>
      </View>
    );
  }

  // Check if permissions are granted
  const hasAllPermissions = cameraPermission.granted && micPermission.granted;

  if (!hasAllPermissions) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera & Microphone Access Required</Text>
        <Text style={styles.permissionSubtext}>
          Please grant both camera and microphone permissions to use this feature
        </Text>
        <View style={styles.permissionButtons}>
          {!cameraPermission.granted && (
            <TouchableOpacity style={styles.grantButton} onPress={requestCameraPermission}>
              <Text style={styles.grantButtonText}>Grant Camera Access</Text>
            </TouchableOpacity>
          )}
          {!micPermission.granted && (
            <TouchableOpacity style={styles.grantButton} onPress={requestMicPermission}>
              <Text style={styles.grantButtonText}>Grant Microphone Access</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing}
        flash={flash}
        mode="video"
        ref={cameraRef}
      />
      
      {/* Filter overlay for visual feedback */}
      {selectedFilter !== 'none' && (
        <View style={[styles.filterOverlay, getFilterOverlayStyle(selectedFilter)]} pointerEvents="none" />
      )}
      
      {/* Controls overlaid on top of camera */}
      <View style={styles.topControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs');
            }
          }}
        >
          <Text style={styles.controlIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={toggleFlash}
        >
          <Text style={styles.controlIcon}>
            {flash === 'on' ? '⚡' : '⚡̶'}
          </Text>
        </TouchableOpacity>
      </View>

      <FilterCarousel 
        selectedFilter={selectedFilter}
        onFilterSelect={setSelectedFilter}
      />

      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={styles.sideButton}
          onPress={() => navigation.navigate('Stories')}
        >
          <Text style={styles.sideButtonText}>Stories</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isRecording && styles.recordingButton]}
          onPress={handleCapturePress}
          onLongPress={handleCaptureLongPress}
          onPressOut={handleCaptureRelease}
          activeOpacity={0.8}
        >
          <View style={[styles.captureInner, isRecording && styles.recordingInner]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.sideButton}
          onPress={flipCamera}
        >
          <Text style={styles.controlIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  permissionText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionSubtext: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionButtons: {
    gap: 10,
  },
  grantButton: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 5,
  },
  grantButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 24,
    color: '#FFF',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    borderColor: '#FF0000',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  recordingInner: {
    backgroundColor: '#FF0000',
  },
  sideButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sideButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  recordingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});