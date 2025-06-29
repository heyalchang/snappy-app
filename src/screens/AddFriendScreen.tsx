import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<MainStackParamList, 'AddFriend'>;

interface SuggestedFriend {
  id: string;
  username: string;
  avatar_emoji?: string | null;
  avatar_color?: string | null;
}

export default function AddFriendScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);

  /* ----------------------------------------------------------------------- */
  /*                           Suggested friends                             */
  /* ----------------------------------------------------------------------- */
  useEffect(() => {
    loadSuggestedFriends();
  }, [user]);

  const loadSuggestedFriends = async () => {
    if (!user) return;
    try {
      // -----------------------------------------------------------------
      // 1. Get all accepted friendships for the current user
      // -----------------------------------------------------------------
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendError) throw friendError;

      const friendIds = new Set<string>();
      friendships?.forEach((f) => {
        // Push the *other* party’s id into the set
        if (f.user_id === user.id) {
          friendIds.add(f.friend_id);
        } else {
          friendIds.add(f.user_id);
        }
      });

      // -----------------------------------------------------------------
      // 2. Fetch a larger pool of profiles (excluding self)
      // -----------------------------------------------------------------
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji, avatar_color')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // grab more so we can filter locally

      if (profileError) throw profileError;

      // -----------------------------------------------------------------
      // 3. Filter out existing friends, then take up to 10 suggestions
      // -----------------------------------------------------------------
      const suggestions =
        profiles
          ?.filter((p) => !friendIds.has(p.id))
          .slice(0, 10) || [];

      console.log('[AddFriend] Suggested friends loaded:', suggestions.length);
      setSuggestedFriends(suggestions);
    } catch (err) {
      console.error('[AddFriend] Error loading suggested friends:', err);
    }
  };

  /* ----------------------------------------------------------------------- */
  /*                         Shared "add friend" logic                       */
  /* ----------------------------------------------------------------------- */
const addFriend = async (trimmedUsername: string) => {
  if (!user) return;

  console.log('[AddFriend] === Start addFriend ===');
  console.log('[AddFriend] Request to add:', trimmedUsername);

  // Prevent adding yourself
  if (trimmedUsername === user.username) {
    console.warn('[AddFriend] Attempted to add self – aborting.');
    Alert.alert('Error', "You can't add yourself as a friend!");
    return;
  }

  setLoading(true);

  try {
    /* ------------------------------------------------------------------- */
    /* 1. Look up profile                                                  */
    /* ------------------------------------------------------------------- */
    let { data: friendProfile } = await supabase
      .from('profiles')
      .select('id, username, avatar_emoji, avatar_color')
      .eq('username', trimmedUsername)
      .single();

    console.log('[AddFriend] Profile lookup result:', friendProfile);

    /* ------------------------------------------------------------------- */
    /* 2. Auto-create a fake friend if they don’t exist                    */
    /* ------------------------------------------------------------------- */
    if (!friendProfile) {
      console.log('[AddFriend] Profile not found – creating fake profile');
      const { data: fakeProfile, error: fakeError } = await supabase
        .from('fake_profiles')
        .select('*')
        .eq('used', false)
        .limit(1)
        .single();

      if (fakeError || !fakeProfile) {
        console.error('[AddFriend] No fake profiles available:', fakeError);
        Alert.alert('Error', 'Unable to add friend. Please try again.');
        return;
      }

      const email = `${trimmedUsername}@nulldomain.com`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'qwerty',
      });

      if (authError || !authData.user) throw new Error('Failed to create fake auth user');

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

      await supabase
        .from('fake_profiles')
        .update({ used: true })
        .eq('id', fakeProfile.id);

      await supabase.rpc('increment_fake_friends_counter');

      friendProfile = newProfile;
      console.log('[AddFriend] Fake profile created:', newProfile);
    }

    /* ------------------------------------------------------------------- */
    /* 3. Check existing friendship                                        */
    /* ------------------------------------------------------------------- */
    const { data: existingFriendships } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${friendProfile.id}),and(user_id.eq.${friendProfile.id},friend_id.eq.${user.id})`
      );

    if (existingFriendships && existingFriendships.length > 0) {
      console.log('[AddFriend] Already friends – nothing to do.');
      Alert.alert('Info', 'You are already friends!');
      return;
    }

    /* ------------------------------------------------------------------- */
    /* 4. Create mutual friendship                                         */
    /* ------------------------------------------------------------------- */
    const { error: friendshipError } = await supabase
      .from('friendships')
      .insert([
        { user_id: user.id, friend_id: friendProfile.id, status: 'accepted' },
        { user_id: friendProfile.id, friend_id: user.id, status: 'accepted' },
      ]);

    if (friendshipError) throw friendshipError;

    console.log('[AddFriend] Friendship created →', {
      userId: user.id,
      friendId: friendProfile.id,
    });

    Alert.alert('Success!', `You are now friends with @${friendProfile.username}!`);
  } catch (err) {
    console.error('[AddFriend] Error during addFriend:', err);
    Alert.alert('Error', 'Failed to add friend. Please try again.');
  } finally {
    setLoading(false);
    console.log('[AddFriend] === End addFriend ===');
  }
};

  /* ----------------------------------------------------------------------- */
  /*                          Button handlers                                */
  /* ----------------------------------------------------------------------- */
  const handleAddFriendPress = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    const trimmed = username.trim().toLowerCase();
    await addFriend(trimmed);
    setUsername('');
    loadSuggestedFriends(); // Refresh suggestions
  };

  const handleQuickAdd = async (friendUsername: string) => {
    if (loading) return;
    const trimmed = friendUsername.trim().toLowerCase();
    await addFriend(trimmed);
    setSuggestedFriends((prev) => prev.filter((f) => f.username !== trimmed));
  };

  /* ----------------------------------------------------------------------- */
  /*                                  UI                                     */
  /* ----------------------------------------------------------------------- */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Friend</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.instructions}>Add friends by their username</Text>

          {/* USERNAME INPUT -------------------------------------------------- */}
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
              onSubmitEditing={handleAddFriendPress}
              editable={!loading}
            />
          </View>

          {/* MAIN ADD BUTTON ------------------------------------------------- */}
          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddFriendPress}
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

          {/* SEPARATOR ------------------------------------------------------- */}
          {suggestedFriends.length > 0 && <View style={styles.separator} />}

          {/* SUGGESTED FRIENDS ---------------------------------------------- */}
          {suggestedFriends.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggested Friends</Text>
              {suggestedFriends.map((friend) => (
                <View key={friend.id} style={styles.suggestionRow}>
                  <View
                    style={[
                      styles.suggestionAvatar,
                      { backgroundColor: friend.avatar_color || '#FFB6C1' },
                    ]}
                  >
                    <Text style={styles.suggestionAvatarEmoji}>
                      {friend.avatar_emoji || '😎'}
                    </Text>
                  </View>

                  <Text style={styles.suggestionUsername}>@{friend.username}</Text>

                  <TouchableOpacity
                    style={styles.suggestAddButton}
                    onPress={() => handleQuickAdd(friend.username)}
                    disabled={loading}
                  >
                    <Text style={styles.suggestAddButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Stylesheet                                  */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
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
  /* ------------------- NEW SECTION: SUGGESTED FRIENDS ------------------- */
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 30,
  },
  suggestionsContainer: {
    marginBottom: 30,
  },
  suggestionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionAvatarEmoji: {
    fontSize: 20,
  },
  suggestionUsername: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  suggestAddButton: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  suggestAddButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});