import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import AuthScreen from './screens/AuthScreen';
import PhoneNumberScreen from './screens/PhoneNumberScreen';
import VerifyCodeScreen from './screens/VerifyCodeScreen';
import UsernameScreen from './screens/UsernameScreen';
import CameraScreen from './screens/CameraScreen';
import MediaPreviewScreen from './screens/MediaPreviewScreen';
import { FriendsScreen, ChatScreen, StoriesScreen } from './screens/PlaceholderScreens';

export type RootStackParamList = {
  Auth: undefined;
  PhoneNumber: undefined;
  VerifyCode: { phoneNumber: string };
  Username: undefined;
  Camera: undefined;
  SnapPreview: { mediaUri: string; mediaType: 'photo' | 'video' };
  Friends: undefined;
  Chat: { friendId: string };
  Stories: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  // TODO: Check auth state and show appropriate stack
  // Temporarily set to true for Week 2 development
  const isAuthenticated = true;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
            <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
            <Stack.Screen name="Username" component={UsernameScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="SnapPreview" component={MediaPreviewScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Stories" component={StoriesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}