import React, { useCallback, useState } from 'react';
import { View, Text, Switch, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signOut as firebaseSignOut } from '../../auth/firebase';
import { usersApi, notificationsApi } from '../../api/endpoints';
import { unregisterPushNotifications } from '../../services/notifications';
import {
  downloadNotesForOffline,
  clearOfflineData,
  getOfflineStorageSize,
} from '../../services/offline/sync.service';
import { getSyncMeta } from '../../services/offline/database';
import { useAuthStore } from '../../store/auth.store';
import { useSubscriptionStore } from '../../store/subscription.store';
import { useOfflineStore } from '../../store/offline.store';
import { useUIStore } from '../../store/ui.store';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ProfileStackParamList } from '../../navigation/types';
import { Visibility } from '../../types';
import { colors, typography, spacing } from '../../theme';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { isActive: isConnoisseur, tier } = useSubscriptionStore();
  const { defaultVisibility, setDefaultVisibility } = useUIStore();
  const {
    isSyncing,
    lastSyncAt,
    downloadedNotes,
    storageSizeBytes,
    setSyncing,
    setLastSync,
    setStorageSize,
    reset: resetOffline,
  } = useOfflineStore();

  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const { data: notifPrefs } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: notificationsApi.getPreferences,
  });

  const updateNotifPrefsMutation = useMutation({
    mutationFn: (data: Record<string, boolean>) =>
      notificationsApi.updatePreferences(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] }),
  });

  const refreshOfflineInfo = useCallback(async () => {
    const size = await getOfflineStorageSize();
    setStorageSize(size);
    const lastSync = await getSyncMeta('lastSyncAt');
    if (lastSync) setLastSync(lastSync, downloadedNotes);
  }, [setStorageSize, setLastSync, downloadedNotes]);

  const handleDownloadOffline = useCallback(async () => {
    if (!isConnoisseur) {
      navigation.navigate('Paywall');
      return;
    }
    setSyncing(true);
    try {
      await downloadNotesForOffline((count, hasMore) => {
        setLastSync(new Date().toISOString(), count);
      });
      await refreshOfflineInfo();
      Alert.alert('Success', 'Notes downloaded for offline access.');
    } catch {
      Alert.alert('Error', 'Failed to download notes. Please try again.');
    } finally {
      setSyncing(false);
    }
  }, [isConnoisseur, navigation, setSyncing, setLastSync, refreshOfflineInfo]);

  const handleClearOffline = useCallback(() => {
    Alert.alert('Clear Offline Data', 'This will remove all cached notes and photos.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearOfflineData();
          resetOffline();
        },
      },
    ]);
  }, [resetOffline]);

  const updateMutation = useMutation({
    mutationFn: (data: { displayName: string }) => usersApi.updateMe(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      Alert.alert('Saved', 'Profile updated.');
    },
  });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await unregisterPushNotifications();
          await firebaseSignOut();
          logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Input
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Button
          title="Save"
          onPress={() => updateMutation.mutate({ displayName })}
          loading={updateMutation.isPending}
          disabled={displayName === user?.displayName}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>
            {isConnoisseur ? 'Connoisseur' : 'Free Plan'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall')}>
            <Text style={{ ...typography.bodySmall, color: colors.primary }}>
              {isConnoisseur ? 'Manage' : 'Upgrade'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {([
          ['newNoteInFollowed', 'New notes in followed binders'],
          ['signalOnMyNote', 'Signals on my notes'],
          ['newGourmetFriend', 'New Gourmet Friend pins'],
          ['pioneerAlert', 'Pioneer alerts'],
        ] as const).map(([key, label]) => (
          <View key={key} style={styles.switchRow}>
            <Text style={styles.label}>{label}</Text>
            <Switch
              value={notifPrefs?.[key] ?? true}
              onValueChange={(v) => updateNotifPrefsMutation.mutate({ [key]: v })}
              trackColor={{ true: colors.primary }}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Defaults</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Default notes to Public</Text>
          <Switch
            value={defaultVisibility === Visibility.PUBLIC}
            onValueChange={(v) =>
              setDefaultVisibility(v ? Visibility.PUBLIC : Visibility.PRIVATE)
            }
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>

      {isConnoisseur && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline Mode</Text>
          <Button
            title={isSyncing ? 'Downloading...' : 'Download Notes for Offline'}
            onPress={handleDownloadOffline}
            loading={isSyncing}
            disabled={isSyncing}
          />
          {lastSyncAt && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.label}>
                Last sync: {new Date(lastSyncAt).toLocaleDateString()}
              </Text>
              <Text style={styles.label}>
                {downloadedNotes} notes cached ({formatBytes(storageSizeBytes)})
              </Text>
            </View>
          )}
          {lastSyncAt && (
            <TouchableOpacity
              onPress={handleClearOffline}
              style={{ marginTop: spacing.sm }}
            >
              <Text style={{ ...typography.bodySmall, color: colors.error }}>
                Clear Offline Data
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
        />
      </View>
    </View>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: { ...typography.body, color: colors.text },
});
