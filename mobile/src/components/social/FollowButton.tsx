import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { binderFollowsApi } from '../../api/endpoints';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface FollowButtonProps {
  binderId: string;
  isFollowing: boolean;
}

export function FollowButton({ binderId, isFollowing }: FollowButtonProps) {
  const queryClient = useQueryClient();
  const [localFollowing, setLocalFollowing] = useState(isFollowing);

  // Sync local state when prop changes (e.g., after query refetch)
  useEffect(() => {
    setLocalFollowing(isFollowing);
  }, [isFollowing]);

  const followMutation = useMutation({
    mutationFn: () => binderFollowsApi.follow(binderId),
    onMutate: () => {
      setLocalFollowing(true);
    },
    onError: () => {
      setLocalFollowing(false);
      Alert.alert('Error', 'Could not follow this binder. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => binderFollowsApi.unfollow(binderId),
    onMutate: () => {
      setLocalFollowing(false);
    },
    onError: () => {
      setLocalFollowing(true);
      Alert.alert('Error', 'Could not unfollow this binder. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  const handlePress = () => {
    if (localFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, localFollowing && styles.buttonFollowing]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={localFollowing ? colors.text : colors.textInverse} />
      ) : (
        <Text style={[styles.text, localFollowing && styles.textFollowing]}>
          {localFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonFollowing: {
    backgroundColor: colors.border,
  },
  text: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '600',
  },
  textFollowing: {
    color: colors.text,
  },
});
