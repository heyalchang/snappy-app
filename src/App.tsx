import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './Navigation';
import { AuthProvider } from './contexts/AuthContext';

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Navigation />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </AuthProvider>
  );
}