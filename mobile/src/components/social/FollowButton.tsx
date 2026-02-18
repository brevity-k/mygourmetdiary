import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { binderFollowsApi } from '../../api/endpoints';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface FollowButtonProps {
  binderId: string;
  isFollowing: boolean;
}

export function FollowButton({ binderId, isFollowing }: FollowButtonProps) {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () => binderFollowsApi.follow(binderId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => binderFollowsApi.unfollow(binderId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  const handlePress = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isFollowing && styles.buttonFollowing]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isFollowing ? colors.text : colors.textInverse} />
      ) : (
        <Text style={[styles.text, isFollowing && styles.textFollowing]}>
          {isFollowing ? 'Following' : 'Follow'}
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
