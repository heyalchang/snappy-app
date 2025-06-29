import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

interface ProfileStats {
  friendCount: number;
  snapScore: number;
  storiesPosted: number;
}

interface ProfileData {
  persona?: string | null;
  age?: number | null;
  messaging_goals?: string | null;
  influencer_focus?: string | null;
  blog_url?: string | null;
  bio?: string | null;
  follower_count?: number | null;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    friendCount: 0,
    snapScore: 0,
    storiesPosted: 0,
  });
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileStats();
    }
  }, [user]);

  const loadProfileStats = async () => {
    if (!user) return;

    try {
      // Get friend count
      const { count: friendCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      // Get snap score and persona data from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('snap_score, persona, age, messaging_goals, influencer_focus, blog_url, bio, follower_count')
        .eq('id', user.id)
        .single();

      // Get stories posted count
      const { count: storiesCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      setStats({
        friendCount: friendCount || 0,
        snapScore: profile?.snap_score || 0,
        storiesPosted: storiesCount || 0,
      });
      
      setProfileData({
        persona: profile?.persona,
        age: profile?.age,
        messaging_goals: profile?.messaging_goals,
        influencer_focus: profile?.influencer_focus,
        blog_url: profile?.blog_url,
        bio: profile?.bio,
        follower_count: profile?.follower_count,
      });
    } catch (error) {
      console.error('Error loading profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          style={styles.headerEditButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.headerEditText}>✏️</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      <View style={styles.profileSection}>
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: user?.avatarColor || '#FFB6C1' }
          ]}
        >
          <Text style={styles.avatarEmoji}>
            {user?.avatarEmoji || '😎'}
          </Text>
        </View>
        
        <Text style={styles.username}>@{user?.username}</Text>
        {user?.display_name && (
          <Text style={styles.displayName}>{user.display_name}</Text>
        )}
        {profileData.age && (
          <Text style={styles.ageText}>Age {profileData.age}</Text>
        )}
        {profileData.influencer_focus && (
          <View style={styles.focusBadge}>
            <Text style={styles.focusBadgeText}>
              {profileData.influencer_focus.charAt(0).toUpperCase() + profileData.influencer_focus.slice(1)} Creator
            </Text>
          </View>
        )}
        {profileData.follower_count !== null && profileData.follower_count > 0 && (
          <Text style={styles.followerCount}>
            {profileData.follower_count.toLocaleString()} followers
          </Text>
        )}
        {profileData.blog_url && (
          <TouchableOpacity
            style={{ marginTop: 10 }}
            onPress={() => Linking.openURL(profileData.blog_url!)}
          >
            <Text style={styles.websiteText}>{profileData.blog_url}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {profileData.bio && (
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{profileData.bio}</Text>
        </View>
      )}
      
      {profileData.persona && (
        <View style={styles.personaContainer}>
          <Text style={styles.personaTitle}>About Me</Text>
          <Text style={styles.personaText}>{profileData.persona}</Text>
        </View>
      )}
      

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.snapScore}</Text>
          <Text style={styles.statLabel}>Snap Score</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.friendCount}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.storiesPosted}</Text>
          <Text style={styles.statLabel}>Stories</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonHalf]}
            onPress={() => navigation.navigate('AddFriend')}
          >
            <Text style={styles.actionButtonText}>Add Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonHalf]}
            onPress={() => navigation.navigate('Friends')}
          >
            <Text style={styles.actionButtonText}>My Friends</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flex: 1,
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
  headerEditButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEditText: {
    color: '#FFFC00',
    fontSize: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 10, // tightened
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  username: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  displayName: {
    color: '#999',
    fontSize: 16,
  },
  ageText: {
    color: '#FFFC00',
    fontSize: 14,
    marginTop: 5,
  },
  personaContainer: {
    marginHorizontal: 20,
    marginBottom: 12, // tightened
    padding: 15,
    backgroundColor: '#111',
    borderRadius: 12,
  },
  personaTitle: {
    color: '#FFFC00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  personaText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical: 10, // tightened
    marginHorizontal: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 12, // tightened
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFC00',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6, // reduced from 12
  },
  actionButtonHalf: {
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#FFFC00',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff4444',
    marginTop: 8, // reduced from 20
  },
  signOutButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  focusBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  focusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  websiteText: {
    color: '#2196F3',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  followerCount: {
    color: '#FFFC00',
    fontSize: 14,
    marginTop: 8,
  },
  bioContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFFC00',
  },
  bioText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  blogButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 25,
    alignItems: 'center',
  },
  blogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});