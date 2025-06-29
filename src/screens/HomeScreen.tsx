import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { user, signOut } = useAuth();
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicImageUrl, setMagicImageUrl] = useState<string | null>(null);

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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.avatarCircle, { backgroundColor: user?.avatar_color || '#FFB6C1' }]}>
            <Text style={styles.avatarEmoji}>{user?.avatar_emoji || '😎'}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Snappy</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>⚡</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome, {user?.displayName || user?.username}!</Text>
        
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.cameraEmoji}>📸</Text>
          <Text style={styles.cameraText}>Take a Snap</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Snap Score: {user?.snapScore || 0}</Text>
          <Text style={styles.avatarInfo}>
            {user?.avatarEmoji} {user?.avatarColor}
          </Text>
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
  avatarInfo: {
    fontSize: 24,
  },
  logoutButton: {
    width: 40,
    height: 40,
    backgroundColor: '#000',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    fontSize: 20,
    color: '#FFFC00',
    transform: [{ rotate: '90deg' }],
  },
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
});