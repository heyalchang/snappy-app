import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator, Image, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { user, signOut } = useAuth();
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicImageUrl, setMagicImageUrl] = useState<string | null>(null);
  
  // Debug: Log user avatar data
  console.log('Current user avatar:', {
    username: user?.username,
    emoji: user?.avatarEmoji,
    color: user?.avatarColor
  });
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const {
    autoLoginEnabled,
    passwordCheckEnabled,
    friendActionsEnabled,
    setFlag,
  } = useFeatureFlags();

  const handleMagicPress = async () => {
    console.log('=== MAGIC SNAP START ===');
    console.log('Opening modal and starting generation...');
    
    setShowMagicModal(true);
    setMagicLoading(true);
    setMagicImageUrl(null);

    try {
      const payload = {
        prompt: 'random jungle animal cartoon character riding a surfboard',
        usePlaceholder: false
      };
      
      console.log('Calling edge function with payload:', JSON.stringify(payload));
      console.log('Function URL:', `${supabase.functions.url}/generate_magic_snap`);
      
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('generate_magic_snap', {
        body: payload
      });
      const endTime = Date.now();
      
      console.log(`Response received in ${endTime - startTime}ms`);
      console.log('Response data:', data);
      console.log('Response error:', error);
      
      if (error) {
        console.error('Edge function error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          context: error.context,
          details: error.details
        });
        throw error;
      }
      
      if (!data?.url) {
        console.error('Invalid response format:', data);
        throw new Error('No image URL returned');
      }

      console.log('Successfully received image URL:', data.url);
      setMagicImageUrl(data.url);
      console.log('=== MAGIC SNAP SUCCESS ===');
    } catch (error) {
      console.error('=== MAGIC SNAP ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      console.error('Stack trace:', error.stack);
      Alert.alert('Error', `Failed to generate magic snap: ${error.message}`);
      setShowMagicModal(false);
    } finally {
      setMagicLoading(false);
    }
  };

  const handleLogout = () => {
    setShowSettingsModal(true);
  };
  
  const confirmLogout = async () => {
    setShowSettingsModal(false);
    await signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.avatarCircle, { backgroundColor: user?.avatarColor || '#FFB6C1' }]}>
            <Text style={styles.avatarEmoji}>{user?.avatarEmoji || '😎'}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleLogout}
        >
          <Text style={{ fontSize: 24 }}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.displayName || user?.username}!
        </Text>
        {!!user?.displayName && (
          <Text style={styles.usernameText}>@{user.username}</Text>
        )}

        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.cameraEmoji}>📸</Text>
          <Text style={styles.cameraText}>Take a Snap</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Snap Score: {user?.snapScore || 0}</Text>
        </View>
        
        {/* Magic sparkle button - temporary */}
        <TouchableOpacity 
          style={styles.magicButton}
          onPress={handleMagicPress}
        >
          <Text style={styles.magicButtonText}>✨</Text>
        </TouchableOpacity>
      </View>

      {/* Magic Modal */}
      <Modal
        visible={showMagicModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowMagicModal(false);
          setMagicImageUrl(null);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowMagicModal(false);
            setMagicImageUrl(null);
          }}
        >
          <View style={styles.modalContent}>
            {magicLoading ? (
              <ActivityIndicator size="large" color="#FFFC00" />
            ) : magicImageUrl ? (
              <Image 
                source={{ uri: magicImageUrl }} 
                style={styles.magicImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBox}
          >
            <Text style={styles.modalTitle}>Settings</Text>
            
            <View style={styles.settingsList}>
              {/* Auto-login: Controls whether auto-login buttons are displayed */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Auto-Login</Text>
                  <Text style={styles.settingDescription}>Show auto-login buttons on login screen</Text>
                </View>
                <Switch
                  value={autoLoginEnabled}
                  onValueChange={(v) => setFlag('autoLoginEnabled', v)}
                  trackColor={{ false: '#333', true: '#FFFC00' }}
                  thumbColor={autoLoginEnabled ? '#000' : '#666'}
                  ios_backgroundColor="#333"
                />
              </View>
              
              {/* Bypass Password */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Bypass Password</Text>
                  <Text style={styles.settingDescription}>
                    Allow sign-in / sign-up without entering a password
                  </Text>
                </View>
                <Switch
                  // When ON we bypass password → passwordCheckEnabled becomes false
                  value={!passwordCheckEnabled}
                  onValueChange={(v) => setFlag('passwordCheckEnabled', !v)}
                  trackColor={{ false: '#333', true: '#FFFC00' }}
                  thumbColor={!passwordCheckEnabled ? '#000' : '#666'}
                  ios_backgroundColor="#333"
                />
              </View>
              
              {/* Friend actions: Controls accept/reject functionality */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Friend Actions</Text>
                  <Text style={styles.settingDescription}>Enable friend accept/reject features</Text>
                </View>
                <Switch
                  value={friendActionsEnabled}
                  onValueChange={(v) => setFlag('friendActionsEnabled', v)}
                  trackColor={{ false: '#333', true: '#FFFC00' }}
                  thumbColor={friendActionsEnabled ? '#000' : '#666'}
                  ios_backgroundColor="#333"
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={confirmLogout}
            >
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFC00',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  profileButton: {
    width: 40,
    height: 40,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 40,
    textAlign: 'center',
  },
  usernameText: {
    fontSize: 16,
    color: '#666',
    marginTop: -8,
    marginBottom: 30,
  },
  cameraButton: {
    backgroundColor: '#FFF',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 40,
  },
  cameraEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  cameraText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  // avatarInfo removed
  magicButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  magicButtonText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  magicImage: {
    width: '100%',
    height: '100%',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsList: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#FFFC00',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});