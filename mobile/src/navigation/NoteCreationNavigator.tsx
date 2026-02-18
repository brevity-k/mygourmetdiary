import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NoteTypeSelectScreen } from '../screens/note-creation/NoteTypeSelectScreen';
import { RestaurantNoteFormScreen } from '../screens/note-creation/RestaurantNoteFormScreen';
import { WineNoteFormScreen } from '../screens/note-creation/WineNoteFormScreen';
import { SpiritNoteFormScreen } from '../screens/note-creation/SpiritNoteFormScreen';
import { WineryVisitNoteFormScreen } from '../screens/note-creation/WineryVisitNoteFormScreen';
import { NoteCreationStackParamList } from './types';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<NoteCreationStackParamList>();

export function NoteCreationNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { ...typography.h3 },
        presentation: 'modal',
      }}
    >
      <Stack.Screen
        name="NoteTypeSelect"
        component={NoteTypeSelectScreen}
        options={{ title: 'New Note' }}
      />
      <Stack.Screen
        name="RestaurantNoteForm"
        component={RestaurantNoteFormScreen}
        options={{ title: 'Restaurant Note' }}
      />
      <Stack.Screen
        name="WineNoteForm"
        component={WineNoteFormScreen}
        options={{ title: 'Wine Note' }}
      />
      <Stack.Screen
        name="SpiritNoteForm"
        component={SpiritNoteFormScreen}
        options={{ title: 'Spirit Note' }}
      />
      <Stack.Screen
        name="WineryVisitNoteForm"
        component={WineryVisitNoteFormScreen}
        options={{ title: 'Winery Visit' }}
      />
    </Stack.Navigator>
  );
}
