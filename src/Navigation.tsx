import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from './contexts/AuthContext';

// Import screens
import AuthScreen from './screens/AuthScreen';
import UsernameScreen from './screens/UsernameScreen';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import MediaPreviewScreen from './screens/MediaPreviewScreen';
import SnapInboxScreen from './screens/SnapInboxScreen';
import SnapViewScreen from './screens/SnapViewScreen';
import ProfileScreen from './screens/ProfileScreen';
import AddFriendScreen from './screens/AddFriendScreen';
import FriendsListScreen from './screens/FriendsListScreen';
import StoriesScreen from './screens/StoriesScreen';
import StoryViewerScreen from './screens/StoryViewerScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import DebugAIScreen from './screens/DebugAIScreen';
import { FilterType } from './utils/filters';

export type MainStackParamList = RootStackParamList;

export type RootStackParamList = {
  Auth: undefined;
  Username: { username: string };
  MainTabs: undefined;
  Camera: undefined;
  SnapPreview: { 
    mediaUri: string; 
    mediaType: 'photo' | 'video'; 
    filterType?: FilterType;
    chatContext?: { friendId: string; friendUsername: string };
  };
  SnapView: { snapId: string };
  Chat: { friendId: string; friendUsername: string };
  Profile: undefined;
  AddFriend: undefined;
  Friends: undefined;
  StoryViewer: { userId: string; initialStoryIndex?: number };
  EditProfile: undefined;
  DebugAI: undefined;
  UserProfile: { userId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Stories: undefined;
  Chats: undefined;
  SnapInbox: undefined;
  Friends: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFFC00',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="🏠" color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Stories" 
        component={StoriesScreen}
        options={{
          tabBarLabel: 'Stories',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="📖" color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="💬" color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="SnapInbox" 
        component={SnapInboxScreen}
        options={{
          tabBarLabel: 'Snaps',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="📬" color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsListScreen}
        options={{
          tabBarLabel: 'Friends',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="👥" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Simple emoji icon component
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return (
    <Text style={{ fontSize: 24, opacity: color === '#666' ? 0.6 : 1 }}>
      {emoji}
    </Text>
  );
}

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
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="SnapPreview" component={MediaPreviewScreen} />
            <Stack.Screen name="SnapView" component={SnapViewScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="AddFriend" component={AddFriendScreen} />
            <Stack.Screen name="Friends" component={FriendsListScreen} />
            <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="UserProfile" component={require('./screens/UserProfileScreen').default} />
            <Stack.Screen name="DebugAI" component={DebugAIScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}