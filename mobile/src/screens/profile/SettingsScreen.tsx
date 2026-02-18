import React, { useState } from 'react';
import { View, Text, Switch, Alert, StyleSheet } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { signOut as firebaseSignOut } from '../../auth/firebase';
import { usersApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Visibility } from '../../types';
import { colors, typography, spacing } from '../../theme';

export function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { defaultVisibility, setDefaultVisibility } = useUIStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');

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
