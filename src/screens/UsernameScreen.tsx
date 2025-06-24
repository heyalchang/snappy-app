import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';

type UsernameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Username'>;

interface Props {
  navigation: UsernameScreenNavigationProp;
}

export default function UsernameScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleComplete = async () => {
    if (username.length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters long');
      return;
    }

    try {
      // TODO: Save user profile to Firebase
      // For now, just navigate to camera
      navigation.reset({
        index: 0,
        routes: [{ name: 'Camera' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
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
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="snapuser123"
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          <Text style={styles.hint}>
            Letters, numbers, and underscores only
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
          style={[styles.completeButton, !username && styles.disabledButton]}
          onPress={handleComplete}
          disabled={!username}
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