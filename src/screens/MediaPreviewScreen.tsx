import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TextInput,
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../Navigation';

type MediaPreviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SnapPreview'>;
type MediaPreviewScreenRouteProp = RouteProp<RootStackParamList, 'SnapPreview'>;

export default function MediaPreviewScreen() {
  const navigation = useNavigation() as MediaPreviewScreenNavigationProp;
  const route = useRoute<MediaPreviewScreenRouteProp>();
  const { mediaUri, mediaType } = route.params;
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Initialize video player for video playback
  const player = useVideoPlayer(mediaType === 'video' ? mediaUri : null, player => {
    if (mediaType === 'video') {
      player.loop = true;
      player.play();
    }
  });

  const saveToGallery = async () => {
    try {
      setSaving(true);
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to save media');
        return;
      }

      // Save to gallery
      await MediaLibrary.saveToLibraryAsync(mediaUri);
      Alert.alert('Success', 'Saved to gallery!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save to gallery');
    } finally {
      setSaving(false);
    }
  };

  const sendSnap = () => {
    // TODO: Implement send functionality in Week 3
    Alert.alert('Coming Soon', 'Send functionality will be implemented in Week 3');
  };

  const retake = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.mediaContainer}>
        {mediaType === 'photo' ? (
          <Image source={{ uri: mediaUri }} style={styles.media} />
        ) : (
          <VideoView
            style={styles.media}
            player={player}
            contentFit="cover"
          />
        )}

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity 
            style={styles.topButton}
            onPress={retake}
          >
            <Text style={styles.topButtonText}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.topButton}
            onPress={saveToGallery}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.topButtonText}>💾</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={100}
          />
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.retakeButton}
            onPress={retake}
          >
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sendButton}
            onPress={sendSnap}
          >
            <Text style={styles.sendButtonText}>Send →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaContainer: {
    flex: 1,
  },
  media: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  captionContainer: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    width: '80%',
    maxWidth: 300,
  },
  captionInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
  },
  retakeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retakeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});