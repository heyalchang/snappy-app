import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* --------------------------------------------------------------------- */
  /*                           Load current profile                        */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, bio, blog_url')
          .eq('id', user.id)
          .single();
        if (error) throw error;

        setDisplayName(data?.display_name || '');
        setBio(data?.bio || '');
        setWebsite(data?.blog_url || '');
      } catch (err) {
        console.error('[EditProfile] Error loading profile:', err);
        Alert.alert('Error', 'Failed to load profile');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  /* --------------------------------------------------------------------- */
  /*                               Handlers                                */
  /* --------------------------------------------------------------------- */
  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updates = {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        blog_url: website.trim() || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      navigation.goBack();
    } catch (err) {
      console.error('[EditProfile] Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header --------------------------------------------------------- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backTxt}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Form ----------------------------------------------------------- */}
        <View style={styles.formItem}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            maxLength={30}
          />
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 160))}
            placeholder="Tell the world about yourself…"
            multiline
          />
          <Text style={styles.charCount}>{bio.length}/160</Text>
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
            autoCapitalize="none"
            keyboardType="url"
          />
          {!!website &&
            <TouchableOpacity onPress={() => Linking.openURL(website)}>
              <Text style={styles.previewLink}>Open ↗</Text>
            </TouchableOpacity>}
        </View>

        {/* Save button ---------------------------------------------------- */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveTxt}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  scroll: { paddingHorizontal: 30, paddingTop: 80 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backTxt: { color: '#FFF', fontSize: 24 },
  headerTitle: { flex: 1, color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  formItem: { marginBottom: 30 },
  label: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 16,
  },
  multiline: { height: 100, textAlignVertical: 'top' },
  charCount: { color: '#666', fontSize: 12, textAlign: 'right', marginTop: 4 },
  previewLink: { color: '#2196F3', marginTop: 6, fontSize: 14 },
  saveBtn: {
    backgroundColor: '#FFFC00',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveTxt: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});