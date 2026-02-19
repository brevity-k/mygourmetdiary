import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchScreen } from '../screens/search/SearchScreen';
import { ExploreScreen } from '../screens/search/ExploreScreen';
import { DiscoverScreen } from '../screens/social/DiscoverScreen';
import { NoteDetailScreen } from '../screens/home/NoteDetailScreen';
import { UserProfileScreen } from '../screens/social/UserProfileScreen';
import { PinGourmetFriendScreen } from '../screens/social/PinGourmetFriendScreen';
import { MenuDeciderScreen } from '../screens/menu-decider/MenuDeciderScreen';
import { AreaExplorerScreen } from '../screens/map/AreaExplorerScreen';
import { SearchStackParamList } from './types';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { ...typography.h3 },
      }}
    >
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
      <Stack.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />
      <Stack.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ title: 'Discover Gourmets' }}
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
      <Stack.Screen
        name="AreaExplorer"
        component={AreaExplorerScreen}
        options={{ title: 'Area Explorer' }}
      />
      <Stack.Screen
        name="MenuDecider"
        component={MenuDeciderScreen}
        options={{ title: 'Menu Decider' }}
      />
    </Stack.Navigator>
  );
}
