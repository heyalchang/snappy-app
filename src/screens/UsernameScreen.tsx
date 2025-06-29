import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [ageModalVisible, setAgeModalVisible] = useState(false);
  const [influencerFocus, setInfluencerFocus] = useState<'food' | 'fitness' | 'travel' | 'mom' | 'ai' | ''>('');
  const [blogUrl, setBlogUrl] = useState('');
  const [bio, setBio] = useState('');
  const [generatingPersona, setGeneratingPersona] = useState(false);
  const { signIn } = useAuth();
  const username = route.params.username;

  // Safe-area insets (for bottom padding)
  const insets = useSafeAreaInsets();

  const generateInitialPersona = async (
    userName: string, 
    userAge: number,
    focus?: 'food' | 'fitness' | 'travel' | 'mom' | 'ai'
  ): Promise<{
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
    
    let focusAddition = "";
    let focusGoals = "";
    
    if (focus) {
      const focusTraits = {
        food: "shares amazing recipes and food discoveries",
        fitness: "motivates others with workout tips and healthy lifestyle content",
        travel: "captures stunning destinations and travel experiences",
        mom: "shares parenting wisdom and family moments",
        ai: "explores cutting-edge AI trends and tech innovations"
      };
      
      const focusMessaging = {
        food: "Share recipes, food recommendations, and culinary experiences. Be enthusiastic about flavors and cooking techniques.",
        fitness: "Encourage healthy habits, share workout tips, and celebrate fitness achievements. Be motivating and supportive.",
        travel: "Share travel stories, destination tips, and cultural experiences. Be adventurous and descriptive.",
        mom: "Share parenting tips, family moments, and relatable experiences. Be warm, supportive, and understanding.",
        ai: "Share AI insights, tech trends, and innovation discussions. Be informative and forward-thinking."
      };
      
      focusAddition = ` As a ${focus} influencer, they ${focusTraits[focus]}`;
      focusGoals = ` ${focusMessaging[focus]}`;
    }
    
    const persona = `${userName} is a ${userAge}-year-old who ${randomTrait}. They enjoy ${randomHobby} in their free time and value authentic connections with friends${focusAddition}.`;
    
    return { persona, messaging_goals: goals + focusGoals };
  };

  const handleComplete = async () => {
    const userAge = parseInt(age);
    if (!age || isNaN(userAge) || userAge < 13 || userAge > 60) {
      Alert.alert('Invalid Age', 'Please select an age between 13 and 60.');
      return;
    }

    setGeneratingPersona(true);
    
    try {
      // First sign in the user
      await signIn(username);
      
      // Generate initial persona
      const { persona, messaging_goals } = await generateInitialPersona(
        displayName.trim() || username,
        userAge,
        influencerFocus || undefined
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
        
        if (influencerFocus) {
          updates.influencer_focus = influencerFocus;
        }
        
        if (blogUrl.trim()) {
          updates.blog_url = blogUrl.trim();
        }
        
        if (bio.trim()) {
          updates.bio = bio.trim();
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
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* AGE INPUT ------------------------------------------------------- */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Age *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setAgeModalVisible(true)}
          >
            <Text
              style={[
                styles.dropdownText,
                !age && styles.dropdownPlaceholder,
              ]}
            >
              {age ? age : 'Select age'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Must be 13 or older</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content Focus (Optional)</Text>
          <View style={styles.focusButtons}>
            {(['food', 'fitness', 'travel', 'mom', 'ai'] as const).map((focus) => (
              <TouchableOpacity
                key={focus}
                style={[
                  styles.focusButton,
                  influencerFocus === focus && styles.focusButtonActive
                ]}
                onPress={() => setInfluencerFocus(influencerFocus === focus ? '' : focus)}
              >
                <Text style={[
                  styles.focusButtonText,
                  influencerFocus === focus && styles.focusButtonTextActive
                ]}>
                  {focus.charAt(0).toUpperCase() + focus.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Blog/Social URL (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://myblog.com"
            value={blogUrl}
            onChangeText={setBlogUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bio (Optional)</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell us about yourself..."
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, 160))}
            multiline
            numberOfLines={3}
            maxLength={160}
          />
          <Text style={styles.charCount}>{bio.length}/160</Text>
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
      </ScrollView>

      <Modal
        visible={ageModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAgeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={age}
              onValueChange={(val) => setAge(String(val))}
            >
              {Array.from({ length: 48 }, (_, i) => i + 13).map((n) => (
                <Picker.Item key={n} label={`${n}`} value={`${n}`} />
              ))}
            </Picker>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setAgeModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  </KeyboardAvoidingView>
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
    paddingBottom: 40,
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
  focusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  focusButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  focusButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  focusButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  focusButtonTextActive: {
    color: '#2196F3',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  picker: {
    height: 50,
    color: '#000',
  },
  dropdown: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 18,
    color: '#000',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    paddingBottom: 20,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
});