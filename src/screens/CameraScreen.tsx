import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../Navigation';

import { Surface } from 'gl-react-expo';
import { Shaders, Node, GLSL } from 'gl-react';
import 'webgltexture-loader-expo-camera';
import FilterCarousel from '../components/FilterCarousel';
import { FilterType } from '../utils/filters';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

// Define GLSL shaders for each filter
const shaders = Shaders.create({
  none: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D tex;
      void main() {
        gl_FragColor = texture2D(tex, uv);
      }`
  },
  blackwhite: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D tex;
      void main() {
        vec4 c = texture2D(tex, uv);
        float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(vec3(gray), c.a);
      }`
  },
  sepia: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D tex;
      void main() {
        vec4 c = texture2D(tex, uv);
        gl_FragColor = vec4(
          dot(c.rgb, vec3(0.393, 0.769, 0.189)),
          dot(c.rgb, vec3(0.349, 0.686, 0.168)),
          dot(c.rgb, vec3(0.272, 0.534, 0.131)),
          c.a
        );
      }`
  },
  vintage: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D tex;
      void main() {
        vec4 c = texture2D(tex, uv);
        // VERY red vintage effect
        float gray = dot(c.rgb, vec3(0.3, 0.6, 0.1));
        c.r = gray * 1.8 + 0.2;
        c.g = gray * 0.3;
        c.b = gray * 0.2;
        gl_FragColor = c;
      }`
  },
  face: {
    // Face filter will be handled with overlay
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D tex;
      void main() {
        gl_FragColor = texture2D(tex, uv);
      }`
  }
});

export default function CameraScreen() {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const route = useRoute();
  const chatContext = (route.params as any)?.chatContext;
  
  // Web fallback - camera not fully supported on web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera not supported on web</Text>
        <Text style={styles.permissionSubtext}>
          Please use the mobile app for camera features
        </Text>
        <TouchableOpacity
          style={styles.grantButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.grantButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const surfaceRef = useRef<any>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sunglassesAnimation = useRef(new Animated.Value(0)).current;
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  // Animate sunglasses when face filter is selected
  useEffect(() => {
    if (selectedFilter === 'face') {
      Animated.spring(sunglassesAnimation, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      sunglassesAnimation.setValue(0);
    }
  }, [selectedFilter]);

  const flipCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (!surfaceRef.current || isRecording) return;

    try {
      console.log('Taking picture...');
      const result = await surfaceRef.current.capture();
      console.log('Picture taken:', result);
      
      if (result && result.uri) {
        navigation.navigate('SnapPreview', { 
          mediaUri: result.uri, 
          mediaType: 'photo',
          filterType: selectedFilter,
          chatContext
        });
      }
    } catch (error) {
      console.error('Photo error:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const startRecording = async () => {
    if (isRecording) return;

    // Check microphone permission
    if (!micPermission?.granted) {
      Alert.alert('Permission Required', 'Microphone permission is required for video recording');
      return;
    }

    // GL-React doesn't support video recording directly
    // For now, show a message
    Alert.alert('Video Recording', 'Video recording is not yet supported with filters. Please use photo mode.');
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

  // Determine camera URI based on facing
  const cameraUri = facing === 'back' ? 'camera://back' : 'camera://front';

  return (
    <View style={styles.container}>
      {/* GL Surface with real-time filtered camera */}
      <Surface ref={surfaceRef} style={styles.camera}>
        <Node 
          shader={shaders[selectedFilter] || shaders.none} 
          uniforms={{ tex: { uri: cameraUri } }} 
        />
      </Surface>
      
      {/* Face filter overlay */}
      {selectedFilter === 'face' && (
        <View style={styles.faceFilterContainer} pointerEvents="none">
          <Animated.View 
            style={[
              styles.sunglassesContainer,
              {
                transform: [
                  { translateY: sunglassesAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0]
                  })},
                  { scale: sunglassesAnimation }
                ],
                opacity: sunglassesAnimation
              }
            ]}
          >
            <View style={styles.sunglassesFrame}>
              <View style={styles.leftLens} />
              <View style={styles.bridge} />
              <View style={styles.rightLens} />
            </View>
          </Animated.View>
          <Text style={styles.faceFilterHint}>Position sunglasses on your face</Text>
        </View>
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
          disabled={flash === 'on'} // GL-React doesn't support flash
        >
          <Text style={[styles.controlIcon, { opacity: 0.3 }]}>
            ⚡̶
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
  faceFilterContainer: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  sunglassesContainer: {
    marginBottom: 20,
  },
  sunglassesFrame: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftLens: {
    width: 70,
    height: 60,
    backgroundColor: '#000',
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#333',
  },
  bridge: {
    width: 20,
    height: 3,
    backgroundColor: '#333',
    marginHorizontal: -5,
  },
  rightLens: {
    width: 70,
    height: 60,
    backgroundColor: '#000',
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#333',
  },
  faceFilterHint: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
});