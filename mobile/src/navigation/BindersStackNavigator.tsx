import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BindersScreen } from '../screens/binders/BindersScreen';
import { BinderDetailScreen } from '../screens/binders/BinderDetailScreen';
import { FollowedBindersScreen } from '../screens/binders/FollowedBindersScreen';
import { NoteDetailScreen } from '../screens/home/NoteDetailScreen';
import { UserProfileScreen } from '../screens/social/UserProfileScreen';
import { PinGourmetFriendScreen } from '../screens/social/PinGourmetFriendScreen';
import { BindersStackParamList } from './types';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<BindersStackParamList>();

export function BindersStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { ...typography.h3 },
      }}
    >
      <Stack.Screen
        name="BindersList"
        component={BindersScreen}
        options={{ title: 'Binders' }}
      />
      <Stack.Screen
        name="BinderDetail"
        component={BinderDetailScreen}
        options={({ route }) => ({ title: route.params.binderName })}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{ title: 'Note' }}
      />
      <Stack.Screen
        name="FollowedBinders"
        component={FollowedBindersScreen}
        options={{ title: 'Following' }}
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
