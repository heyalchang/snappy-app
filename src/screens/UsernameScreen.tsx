import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type UsernameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Username'>;

interface Props {
  navigation: UsernameScreenNavigationProp;
}

export default function UsernameScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState('');
  const { user } = useAuth();

  const handleComplete = async () => {
    if (!user) {
      Alert.alert('Error', 'No user found');
      return;
    }

    try {
      // Update profile with display name
      if (displayName.trim()) {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: displayName.trim() })
          .eq('id', user.id);
        
        if (error) throw error;
      }
      
      // Navigation will automatically switch to authenticated stack
      // since user is already set in auth context
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Create your profile</Text>
        <Text style={styles.subtitle}>
          Choose a username and display name
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your username: @{user?.username}</Text>
          <Text style={styles.hint}>
            This is your unique identifier
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Display Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={30}
          />
        </View>

        <TouchableOpacity
          style={[styles.completeButton, !user && styles.disabledButton]}
          onPress={handleComplete}
          disabled={!user}
        >
          <Text style={styles.completeText}>Complete Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  backText: {
    fontSize: 24,
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    fontSize: 18,
    paddingVertical: 10,
    marginBottom: 5,
  },
  hint: {
    fontSize: 14,
    color: '#666',
  },
  completeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  completeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});