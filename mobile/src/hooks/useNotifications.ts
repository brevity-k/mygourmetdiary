import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { registerForPushNotifications } from '../services/notifications';
import { useAuthStore } from '../store/auth.store';

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigation = useNavigation<any>();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register for push
    registerForPushNotifications();

    // Handle notification taps (background → foreground)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (!data) return;

        switch (data.type) {
          case 'new_note':
            // Navigate to binder detail or note
            break;
          case 'signal':
            if (data.noteId) {
              navigation.navigate('HomeTab', {
                screen: 'NoteDetail',
                params: { noteId: data.noteId },
              });
            }
            break;
          case 'friend_pin':
            if (data.userId) {
              navigation.navigate('ProfileTab', {
                screen: 'UserProfile',
                params: { userId: data.userId },
              });
            }
            break;
          case 'pioneer':
            // Navigate to profile to see badges
            navigation.navigate('ProfileTab', { screen: 'Profile' });
            break;
        }
      });

    return () => {
      responseListener.current?.remove();
    };
  }, [isAuthenticated, navigation]);
}
