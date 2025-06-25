import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<MainStackParamList, 'AddFriend'>;

export default function AddFriendScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddFriend = async () => {
    if (!user) return;
    
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (trimmedUsername === user.username) {
      Alert.alert('Error', "You can't add yourself as a friend!");
      return;
    }

    setLoading(true);

    try {
      // Check if user exists
      let { data: friendProfile } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji, avatar_color')
        .eq('username', trimmedUsername)
        .single();

      // If user doesn't exist, create a fake friend
      if (!friendProfile) {
        // Get next fake profile
        const { data: fakeProfile, error: fakeError } = await supabase
          .from('fake_profiles')
          .select('*')
          .eq('used', false)
          .limit(1)
          .single();

        if (fakeError || !fakeProfile) {
          Alert.alert('Error', 'Unable to add friend. Please try again.');
          return;
        }

        // Create fake user
        const email = `${trimmedUsername}@nulldomain.com`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: 'qwerty', // Default password for fake users
        });

        if (authError || !authData.user) {
          throw new Error('Failed to create fake user');
        }

        // Create fake profile with requested username
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: trimmedUsername,
            display_name: trimmedUsername,
            avatar_emoji: fakeProfile.avatar_emoji,
            avatar_color: fakeProfile.avatar_color,
            snap_score: fakeProfile.snap_score || 0,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Mark fake profile as used
        await supabase
          .from('fake_profiles')
          .update({ used: true })
          .eq('id', fakeProfile.id);

        // Update counter
        await supabase.rpc('increment_fake_friends_counter');

        friendProfile = newProfile;
      }

      // Check if friendship already exists
      const { data: existingFriendships } = await supabase
        .from('friendships')
        .select('*')
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${friendProfile.id}),and(user_id.eq.${friendProfile.id},friend_id.eq.${user.id})`
        );

      if (existingFriendships && existingFriendships.length > 0) {
        Alert.alert('Info', 'You are already friends!');
        setUsername('');
        return;
      }

      // Create instant friendship (no pending state)
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert([
          {
            user_id: user.id,
            friend_id: friendProfile.id,
            status: 'accepted',
          },
          {
            user_id: friendProfile.id,
            friend_id: user.id,
            status: 'accepted',
          },
        ]);

      if (friendshipError) throw friendshipError;

      Alert.alert(
        'Success!',
        `You are now friends with @${friendProfile.username}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setUsername('');
              // Don't navigate away, stay on the same screen
              // This allows adding multiple friends
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Friend</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Add friends by their username
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.atSymbol}>@</Text>
          <TextInput
            style={styles.input}
            placeholder="username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleAddFriend}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddFriend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.addButtonText}>Add Friend</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          If they're not on Snappy yet, we'll save them for when they join!
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  instructions: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  atSymbol: {
    color: '#FFFC00',
    fontSize: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    paddingVertical: 15,
  },
  addButton: {
    backgroundColor: '#FFFC00',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 40,
  },
});