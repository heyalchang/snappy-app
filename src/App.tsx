import React from 'react';
// Fix for gl-react compatibility with React 18+
if (!React.RenderLessElement) {
  React.RenderLessElement = React.Fragment;
}

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './Navigation';
import { AuthProvider } from './contexts/AuthContext';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';

export default function App(): React.JSX.Element {
  return (
    <FeatureFlagsProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <Navigation />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </AuthProvider>
    </FeatureFlagsProvider>
  );
}