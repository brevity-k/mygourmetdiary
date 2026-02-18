import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { GourmetFriendsScreen } from '../screens/social/GourmetFriendsScreen';
import { UserProfileScreen } from '../screens/social/UserProfileScreen';
import { PinGourmetFriendScreen } from '../screens/social/PinGourmetFriendScreen';
import { ProfileStackParamList } from './types';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { ...typography.h3 },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="GourmetFriends"
        component={GourmetFriendsScreen}
        options={{ title: 'Gourmet Friends' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="PinGourmetFriend"
        component={PinGourmetFriendScreen}
        options={{ title: 'Pin Friend' }}
      />
    </Stack.Navigator>
  );
}
