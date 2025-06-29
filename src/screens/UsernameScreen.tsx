import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { getCurrentUser } from '../services/auth';

type UsernameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Username'>;
type UsernameScreenRouteProp = RouteProp<RootStackParamList, 'Username'>;

interface Props {
  navigation: UsernameScreenNavigationProp;
  route: UsernameScreenRouteProp;
}

export default function UsernameScreen({ navigation, route }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [generatingPersona, setGeneratingPersona] = useState(false);
  const { signIn } = useAuth();
  const username = route.params.username;

  const generateInitialPersona = async (userName: string, userAge: number): Promise<{
    persona: string;
    messaging_goals: string;
  }> => {
    // Simple persona generation based on age and some randomization
    const teenTraits = [
      "loves gaming and hanging with friends",
      "into music and always discovering new artists",
      "plays sports and stays active",
      "creative type who loves art and design",
      "tech savvy and always trying new apps"
    ];
    
    const youngAdultTraits = [
      "college student studying hard and partying harder",
      "working professional climbing the career ladder",
      "entrepreneur with big dreams and ideas",
      "travel enthusiast exploring the world",
      "fitness junkie who loves staying healthy"
    ];
    
    const adultTraits = [
      "career-focused with a passion for their work",
      "family-oriented and loves spending time with loved ones",
      "hobby enthusiast always learning new skills",
      "community volunteer making a difference",
      "outdoor adventurer who loves nature"
    ];
    
    let traits: string[];
    let goals: string;
    
    if (userAge < 20) {
      traits = teenTraits;
      goals = "Keep conversations fun, use lots of emojis, and be enthusiastic about shared interests.";
    } else if (userAge < 30) {
      traits = youngAdultTraits;
      goals = "Be relatable and supportive, share experiences, and keep things positive but real.";
    } else {
      traits = adultTraits;
      goals = "Be thoughtful and engaging, share wisdom when appropriate, and maintain genuine connections.";
    }
    
    const randomTrait = traits[Math.floor(Math.random() * traits.length)];
    const hobbies = ["cooking", "reading", "gaming", "hiking", "photography", "dancing", "coding"];
    const randomHobby = hobbies[Math.floor(Math.random() * hobbies.length)];
    
    const persona = `${userName} is a ${userAge}-year-old who ${randomTrait}. They enjoy ${randomHobby} in their free time and value authentic connections with friends.`;
    
    return { persona, messaging_goals: goals };
  };

  const handleComplete = async () => {
    const userAge = parseInt(age);
    if (!age || userAge < 13 || userAge > 100) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 13 and 100.');
      return;
    }

    setGeneratingPersona(true);
    
    try {
      // First sign in the user
      await signIn(username);
      
      // Generate initial persona
      const { persona, messaging_goals } = await generateInitialPersona(
        displayName.trim() || username,
        userAge
      );
      
      // Then get the current user to update profile
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const updates: any = {
          age: userAge,
          persona,
          messaging_goals
        };
        
        if (displayName.trim()) {
          updates.display_name = displayName.trim();
        }
        
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentUser.id);
        
        if (error) throw error;
      }
      
      // Navigation will automatically switch to authenticated stack
      // since user is now signed in via auth context
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setGeneratingPersona(false);
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
          <Text style={styles.label}>Your username: @{username}</Text>
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="18"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={styles.hint}>
            Must be 13 or older to use this app
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.completeButton, generatingPersona && styles.disabledButton]}
          onPress={handleComplete}
          disabled={generatingPersona}
        >
          {generatingPersona ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.completeText}>Complete Setup</Text>
          )}
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