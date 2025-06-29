import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../Navigation';
import { supabase } from '../services/supabase';

type Nav = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;
type Route = RouteProp<RootStackParamList, 'UserProfile'>;

interface Profile {
  id: string;
  username: string;
  display_name?: string;
  avatar_emoji?: string;
  avatar_color?: string;
  snap_score: number;
  bio?: string | null;
  blog_url?: string | null;
}

export default function UserProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { userId } = route.params;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ friendCount: 0, stories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Profile
        const { data: p, error: pErr } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_emoji, avatar_color, snap_score, bio, blog_url')
          .eq('id', userId)
          .single();
        if (pErr || !p) throw pErr;

        setProfile(p as Profile);

        // Friend count
        const { count: fCount } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted');

        // Stories
        const { count: sCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', userId);

        setStats({
          friendCount: fCount || 0,
          stories: sCount || 0,
        });
      } catch (e) {
        console.error('[UserProfile] load error:', e);
        Alert.alert('Error', 'Failed to load profile');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar / names */}
        <View style={styles.topSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: profile.avatar_color || '#FFB6C1' },
            ]}
          >
            <Text style={styles.avatarEmoji}>{profile.avatar_emoji || '😎'}</Text>
          </View>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.display_name && profile.display_name !== profile.username && (
            <Text style={styles.displayName}>{profile.display_name}</Text>
          )}
          {profile.blog_url && (
            <TouchableOpacity onPress={() => Linking.openURL(profile.blog_url!)}>
              <Text style={styles.website}>{profile.blog_url}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={styles.bioBox}>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.snap_score}</Text>
            <Text style={styles.statLabel}>Snap Score</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.friendCount}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.stories}</Text>
            <Text style={styles.statLabel}>Stories</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Stylesheet                                  */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backTxt: { color: '#FFF', fontSize: 24 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  topSection: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 50 },
  username: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  displayName: { color: '#999', fontSize: 16, marginTop: 4 },
  website: {
    color: '#2196F3',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  bioBox: {
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 3,
    borderLeftColor: '#FFFC00',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  bio: { color: '#FFF', fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFFC00', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 14 },
  divider: { width: 1, backgroundColor: '#333' },
});