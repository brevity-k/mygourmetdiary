import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeStackNavigator } from './HomeStackNavigator';
import { BindersStackNavigator } from './BindersStackNavigator';
import { SearchStackNavigator } from './SearchStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { NoteCreationNavigator } from './NoteCreationNavigator';
import { MainTabParamList } from './types';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

function EmptyScreen() {
  return null;
}

export function MainNavigator() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderLight,
            height: 88,
            paddingBottom: 32,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="BindersTab"
          component={BindersStackNavigator}
          options={{
            tabBarLabel: 'Binders',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="collections-bookmark" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="CreatePlaceholder"
          component={EmptyScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: () => (
              <View style={styles.fab}>
                <MaterialIcons name="add" size={28} color={colors.textInverse} />
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowCreate(true);
            },
          }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchStackNavigator}
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {showCreate && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowCreate(false)}
          />
          <NoteCreationNavigator />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
});
