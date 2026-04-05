import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationsApi } from '../api/endpoints';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Register with backend
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  await notificationsApi.registerToken(token, platform).catch((e) => console.warn('notification token register error:', e));

  return token;
}

export async function unregisterPushNotifications(): Promise<void> {
  await notificationsApi.removeToken().catch((e) => console.warn('notification token remove error:', e));
}
