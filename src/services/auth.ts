import { 
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
  signInAnonymously,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getAuth } from './firebase';

// Store confirmation result globally
let confirmationResult: ConfirmationResult | null = null;

// For Expo/React Native, we'll need to use a different approach
// since RecaptchaVerifier doesn't work in React Native
export const sendVerificationCode = async (phoneNumber: string) => {
  try {
    // In a real app with Expo, you'd use:
    // 1. expo-firebase-recaptcha for the reCAPTCHA flow
    // 2. Or implement server-side verification with Firebase Admin SDK
    
    // For now, we'll simulate the flow
    console.log('Sending verification code to:', phoneNumber);
    
    // In production, this would actually send an SMS
    // For demo purposes, we'll just return success
    return {
      success: true,
      message: 'Code sent successfully'
    };
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

export const verifyCode = async (code: string) => {
  try {
    // In production, this would verify the code with Firebase
    console.log('Verifying code:', code);
    
    // For demo purposes, accept any 6-digit code and sign in anonymously
    if (code.length === 6) {
      const auth = getAuth();
      const userCredential = await signInAnonymously(auth);
      return {
        success: true,
        user: userCredential.user,
      };
    } else {
      throw new Error('Invalid verification code');
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};

// Listen to auth state changes
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(getAuth(), callback);
};

// Sign out
export const signOut = async () => {
  try {
    await getAuth().signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};