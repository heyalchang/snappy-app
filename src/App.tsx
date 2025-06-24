import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './Navigation';
import { getAuth } from './services/firebase';

// Initialize Firebase Auth early
getAuth();

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <Navigation />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}