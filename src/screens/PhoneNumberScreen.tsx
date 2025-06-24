import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { sendVerificationCode } from '../services/auth';

type PhoneNumberScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhoneNumber'>;

interface Props {
  navigation: PhoneNumberScreenNavigationProp;
}

export default function PhoneNumberScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    // Basic validation
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    // Format as E.164 (assuming US number for now)
    const formatted = cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;
    
    setLoading(true);
    try {
      await sendVerificationCode(formatted);
      // Navigate to verification screen
      navigation.navigate('VerifyCode', { phoneNumber: formatted });
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return text;

    const formatted = [match[1], match[2], match[3]]
      .filter(Boolean)
      .join('-');
    
    return formatted;
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
        <Text style={styles.title}>What's your phone number?</Text>
        <Text style={styles.subtitle}>
          We'll send you a code to verify your number
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={formatPhoneNumber(phoneNumber)}
          onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
          keyboardType="phone-pad"
          maxLength={12}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.continueButton, (!phoneNumber || loading) && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!phoneNumber || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
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
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    fontSize: 24,
    paddingVertical: 10,
    marginBottom: 40,
  },
  continueButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 30,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  continueText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});