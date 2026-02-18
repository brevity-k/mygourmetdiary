import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BindersScreen } from '../screens/binders/BindersScreen';
import { BinderDetailScreen } from '../screens/binders/BinderDetailScreen';
import { NoteDetailScreen } from '../screens/home/NoteDetailScreen';
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
    </Stack.Navigator>
  );
}
