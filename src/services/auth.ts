import { supabase } from './supabase';

const DEFAULT_PASSWORD = 'snapclone123!';

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatarEmoji?: string | null;
  avatarColor?: string | null;
  snapScore: number;
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

    // Create user profile
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: username.toLowerCase(),
      })
      .select()
      .single();

    if (userError) throw userError;

    return {
      id: userData.id,
      username: userData.username,
      displayName: userData.username,  // Profiles table doesn't have these fields yet
      avatarEmoji: null,
      avatarColor: null,
      snapScore: 0,
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
      displayName: userData.username,  // Profiles table doesn't have these fields yet
      avatarEmoji: null,
      avatarColor: null,
      snapScore: 0,
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
      displayName: userData.username,  // Profiles table doesn't have these fields yet
      avatarEmoji: null,
      avatarColor: null,
      snapScore: 0,
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