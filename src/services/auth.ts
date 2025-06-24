import { supabase } from './supabase';

const DEFAULT_PASSWORD = 'qwerty';

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatarEmoji?: string | null;
  avatarColor?: string | null;
  avatarUrl?: string | null;
  snapScore: number;
}

// Generate deterministic avatar based on username
function generateAvatar(username: string): { emoji: string; color: string } {
  const colors = ['#FFB6C1', '#E6E6FA', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C', '#FFE4E1', '#B0E0E6'];
  const emojis = ['😎', '🦄', '🎮', '🌸', '🏀', '🌺', '🛹', '✨', '🎵', '🦋'];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const colorIndex = Math.abs(hash) % colors.length;
  const emojiIndex = Math.abs(hash) % emojis.length;
  
  return {
    emoji: emojis[emojiIndex],
    color: colors[colorIndex]
  };
}

export async function signUp(username: string): Promise<AuthUser> {
  try {
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single();
    
    if (existingUser) {
      throw new Error('Username already taken');
    }

    // Sign up with Supabase Auth using username@nulldomain.com pattern
    const email = `${username.toLowerCase()}@nulldomain.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: DEFAULT_PASSWORD,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // Generate avatar
    const avatar = generateAvatar(username);
    
    // Create user profile
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: username.toLowerCase(),
        display_name: username,
        avatar_emoji: avatar.emoji,
        avatar_color: avatar.color,
        snap_score: 0,
      })
      .select()
      .single();

    if (userError) throw userError;

    return {
      id: userData.id,
      username: userData.username,
      displayName: userData.display_name || userData.username,
      avatarEmoji: userData.avatar_emoji,
      avatarColor: userData.avatar_color,
      avatarUrl: userData.avatar_url,
      snapScore: userData.snap_score || 0,
    };
  } catch (error) {
    throw error;
  }
}

export async function signIn(username: string): Promise<AuthUser> {
  try {
    const email = `${username.toLowerCase()}@nulldomain.com`;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: DEFAULT_PASSWORD,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to sign in');

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) throw userError;

    return {
      id: userData.id,
      username: userData.username,
      displayName: userData.display_name || userData.username,
      avatarEmoji: userData.avatar_emoji,
      avatarColor: userData.avatar_color,
      avatarUrl: userData.avatar_url,
      snapScore: userData.snap_score || 0,
    };
  } catch (error) {
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !userData) return null;

    return {
      id: userData.id,
      username: userData.username,
      displayName: userData.display_name || userData.username,
      avatarEmoji: userData.avatar_emoji,
      avatarColor: userData.avatar_color,
      avatarUrl: userData.avatar_url,
      snapScore: userData.snap_score || 0,
    };
  } catch {
    return null;
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username.toLowerCase())
    .single();
  
  return !!data;
}