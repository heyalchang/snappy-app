import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal, // Add Modal import
  Switch // Add Switch import
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { signIn, signUp } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'; // Change 1: Add useFeatureFlags import

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

interface Props {
  navigation: AuthScreenNavigationProp;
}

export default function AuthScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn: authSignIn } = useAuth();
  const { // Change 2: Add feature flag states
    autoLoginEnabled,
    passwordCheckEnabled,
    setFlag,
  } = useFeatureFlags();
  const [showSettingsModal, setShowSettingsModal] = useState(false); // Change 2: Add showSettingsModal state
  const [password, setPassword] = useState(''); // Change 2: Add password state

  const autoLogin = async (testUsername: string) => {
    setIsLoading(true);
    try {
      await authSignIn(testUsername);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Auto-login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFriends = async (testUsername: string) => {
    try {
      // Get user ID
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', testUsername)
        .single();

      if (userError || !user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Delete all friendships
      const { data: deletedFriendships, error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .select();

      if (deleteError) {
        Alert.alert('Error', 'Failed to clear friends');
        return;
      }

      Alert.alert('Success', `Cleared ${deletedFriendships?.length || 0} friendships for ${testUsername}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear friends');
    }
  };

  const handleAuth = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    if (passwordCheckEnabled && !password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Sign up with username and optional password
        await signUp(username.trim(), passwordCheckEnabled ? password.trim() : undefined); // Change 7: Pass password to signUp
        // Navigate to Username screen before signing in
        navigation.navigate('Username', { username: username.trim() });
      } else {
        // Sign in with username and optional password
        await authSignIn(username.trim(), passwordCheckEnabled ? password.trim() : undefined); // Change 7: Pass password to authSignIn
        // Navigation will automatically switch to authenticated stack
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>👻</Text>
          <Text style={styles.title}>Snappy</Text>
          <Text style={styles.subtitle}>Share moments that disappear</Text>
        </View>
        
        {/* Change 3: Add gear button JSX after Logo block */}
        <View style={{ position: 'absolute', top: 60, right: 30 }}>
          <TouchableOpacity onPress={() => setShowSettingsModal(true)}>
            <Text style={{ fontSize: 24 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        
        {/* Change 4: Add password TextInput inside formContainer, below username input */}
        {passwordCheckEnabled && (
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            secureTextEntry
            editable={!isLoading}
          />
        )}
        
        <TouchableOpacity 
          style={[styles.mainButton, isLoading && styles.disabledButton]}
          onPress={handleAuth}
          disabled={isLoading}
        >
          <Text style={styles.mainButtonText}>
            {isLoading ? 'LOADING...' : (isSignUp ? 'SIGN UP' : 'LOG IN')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
        </View>

        {/* Developer Tools */}
        {autoLoginEnabled && (
        <View style={styles.devToolsContainer}>
          <Text style={styles.devToolsTitle}>Developer Tools</Text>
          
          <View style={styles.devToolRow}>
            <Text style={styles.devUsername}>piratew</Text>
            <TouchableOpacity 
              style={styles.devButton}
              onPress={() => autoLogin('piratew')}
              disabled={isLoading}
            >
              <Text style={styles.devButtonText}>Auto Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.devButton}
              onPress={() => clearFriends('piratew')}
              disabled={isLoading}
            >
              <Text style={styles.devButtonText}>Clear Friends</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.devToolRow}>
            <Text style={styles.devUsername}>schooloffish</Text>
            <TouchableOpacity 
              style={styles.devButton}
              onPress={() => autoLogin('schooloffish')}
              disabled={isLoading}
            >
              <Text style={styles.devButtonText}>Auto Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.devButton}
              onPress={() => clearFriends('schooloffish')}
              disabled={isLoading}
            >
              <Text style={styles.devButtonText}>Clear Friends</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}
      </ScrollView>

      {/* Change 8: Add modal JSX at bottom, before closing main component */}
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
          <TouchableOpacity activeOpacity={1} style={styles.modalBox}>
            <Text style={styles.modalTitle}>Settings</Text>

            <View style={styles.settingsList}>
              {/* Auto-login */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Auto-Login</Text>
                  <Text style={styles.settingDescription}>
                    Show auto-login buttons on login screen
                  </Text>
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
                  value={!passwordCheckEnabled}
                  onValueChange={(v) => setFlag('passwordCheckEnabled', !v)}
                  trackColor={{ false: '#333', true: '#FFFC00' }}
                  thumbColor={!passwordCheckEnabled ? '#000' : '#666'}
                  ios_backgroundColor="#333"
                />
              </View>

              {/* Friend Actions toggle (placeholder) */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Friend Actions</Text>
                  <Text style={styles.settingDescription}>
                    Enable friend accept/reject features
                  </Text>
                </View>
                <Switch
                  value={false}
                  disabled
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.logoutButtonText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFC00',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    marginTop: 10,
  },
  formContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  input: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mainButton: {
    backgroundColor: '#FF0049',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  devToolsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  devToolsTitle: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  devToolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  devUsername: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  devButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  devButtonText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
  // Styles for Modal (Change 8)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '90%',
    backgroundColor: '#000', // Changed to black for consistency with Snap theme
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFC00', // Yellow
    marginBottom: 20,
  },
  settingsList: {
    width: '100%',
    marginBottom: 30,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  settingDescription: {
    fontSize: 13,
    color: '#BBB',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#FF0049', // Red
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});