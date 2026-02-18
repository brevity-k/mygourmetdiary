import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { NoteDetailScreen } from '../screens/home/NoteDetailScreen';
import { UserProfileScreen } from '../screens/social/UserProfileScreen';
import { PinGourmetFriendScreen } from '../screens/social/PinGourmetFriendScreen';
import { HomeStackParamList } from './types';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { ...typography.h3 },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'MyGourmetDiary' }}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{ title: 'Note' }}
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
