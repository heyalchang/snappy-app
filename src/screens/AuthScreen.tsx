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
  ScrollView
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { signIn, signUp } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

interface Props {
  navigation: AuthScreenNavigationProp;
}

export default function AuthScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn: authSignIn } = useAuth();

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

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Sign up with username only
        await signUp(username.trim());
        // Navigate to Username screen before signing in
        navigation.navigate('Username', { username: username.trim() });
      } else {
        // Sign in with username only
        await authSignIn(username.trim());
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
      </ScrollView>
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
});