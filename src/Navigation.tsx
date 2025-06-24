import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './contexts/AuthContext';

// Import screens
import AuthScreen from './screens/AuthScreen';
import UsernameScreen from './screens/UsernameScreen';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import MediaPreviewScreen from './screens/MediaPreviewScreen';
import SnapInboxScreen from './screens/SnapInboxScreen';
import SnapViewScreen from './screens/SnapViewScreen';
import { FriendsScreen, ChatScreen, StoriesScreen } from './screens/PlaceholderScreens';

export type RootStackParamList = {
  Auth: undefined;
  Username: { username: string };
  Home: undefined;
  Camera: undefined;
  SnapPreview: { mediaUri: string; mediaType: 'photo' | 'video' };
  SnapInbox: undefined;
  SnapView: { snapId: string };
  Friends: undefined;
  Chat: { friendId: string };
  Stories: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  
  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Username" component={UsernameScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="SnapPreview" component={MediaPreviewScreen} />
            <Stack.Screen name="SnapInbox" component={SnapInboxScreen} />
            <Stack.Screen name="SnapView" component={SnapViewScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Stories" component={StoriesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}