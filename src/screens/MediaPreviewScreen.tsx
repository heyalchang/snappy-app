import React, { useState, useEffect } from 'react';
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
import { Video, ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../Navigation';
import { sendSnapToSelf } from '../services/media';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { sendMediaMessage, getRoomId } from '../services/chat';

type MediaPreviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SnapPreview'>;
type MediaPreviewScreenRouteProp = RouteProp<RootStackParamList, 'SnapPreview'>;

export default function MediaPreviewScreen() {
  const navigation = useNavigation() as MediaPreviewScreenNavigationProp;
  const route = useRoute<MediaPreviewScreenRouteProp>();
  const { mediaUri, mediaType, filterType = 'none', chatContext } = route.params;
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = React.useRef<Video>(null);

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

  const sendToFriend = async () => {
    if (!user || !chatContext) return;
    
    try {
      setSending(true);
      setUploadProgress(0);

      // Upload to storage
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${mediaType === 'photo' ? 'jpg' : 'mp4'}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Convert to base64 for upload
      const base64 = await FileSystem.readAsStringAsync(mediaUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      setUploadProgress(30);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, decode(base64), {
          contentType: mediaType === 'photo' ? 'image/jpeg' : 'video/mp4',
        });

      if (uploadError) throw uploadError;
      
      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Send as message in chat
      const roomId = getRoomId(user.id, chatContext.friendId);
      await sendMediaMessage(
        roomId,
        user.id,
        chatContext.friendId,
        publicUrl,
        mediaType,
        caption
      );
      
      setUploadProgress(100);

      // Navigate back to chat without alert for smoother experience
      navigation.pop(2); // Go back twice: from MediaPreview -> Camera -> Chat
    } catch (error) {
      console.error('Error sending to friend:', error);
      Alert.alert('Error', 'Failed to send to friend');
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const sendToStory = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      setSending(true);
      setUploadProgress(0);

      // Upload to storage
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${mediaType === 'photo' ? 'jpg' : 'mp4'}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Convert to base64 for upload
      const base64 = await FileSystem.readAsStringAsync(mediaUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, decode(base64), {
          contentType: mediaType === 'photo' ? 'image/jpeg' : 'video/mp4',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Create story post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          caption: caption,
        });

      if (postError) throw postError;

      Alert.alert(
        'Posted!', 
        'Your story has been posted.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error posting story:', error);
      Alert.alert('Error', 'Failed to post story');
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const sendSnap = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      setSending(true);
      setUploadProgress(0);

      await sendSnapToSelf(
        mediaUri,
        mediaType,
        caption,
        user.username,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      Alert.alert(
        'Sent!', 
        'Your snap has been sent to yourself for testing.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to main tabs
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Send snap error:', error);
      Alert.alert('Error', error.message || 'Failed to send snap');
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const retake = () => {
    if (chatContext) {
      // If coming from chat, go back to camera which will still have chatContext
      navigation.goBack();
    } else {
      // Normal flow - just go back to camera
      navigation.goBack();
    }
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
          <Video
            ref={videoRef}
            source={{ uri: mediaUri }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
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
            disabled={sending}
          >
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>

          <View style={styles.sendOptions}>
            {!chatContext && (
              <TouchableOpacity 
                style={[styles.sendButton, styles.storyButton, sending && styles.sendButtonDisabled]}
                onPress={() => sendToStory()}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>My Story</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[
                styles.sendButton, 
                styles.primarySendButton,
                chatContext && styles.chatSendButton,
                sending && styles.sendButtonDisabled
              ]}
              onPress={chatContext ? sendToFriend : sendSnap}
              disabled={sending}
            >
              {sending ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator color={chatContext ? "#FFF" : "#000"} size="small" />
                  <Text style={[styles.sendButtonText, chatContext && styles.chatSendButtonText]}>
                    {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Sending...'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.sendButtonText, chatContext && styles.chatSendButtonText]}>
                  {chatContext ? `Send to ${chatContext.friendUsername}` : 'Send →'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  sendOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  sendButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyButton: {
    backgroundColor: '#FFF',
  },
  primarySendButton: {
    backgroundColor: '#FFFC00',
  },
  chatSendButton: {
    backgroundColor: '#0084FF',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  chatSendButtonText: {
    color: '#FFF',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faceOverlay: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  sunglassesOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftLensOverlay: {
    width: 70,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#333',
  },
  bridgeOverlay: {
    width: 20,
    height: 3,
    backgroundColor: '#333',
    marginHorizontal: -5,
  },
  rightLensOverlay: {
    width: 70,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#333',
  },
});