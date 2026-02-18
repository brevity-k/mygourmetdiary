import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { bindersApi } from '../../api/endpoints';
import { BinderCardSkeleton } from '../../components/common/BinderCardSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { BindersStackParamList } from '../../navigation/types';
import { Binder, BinderCategory } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type NavigationProp = NativeStackNavigationProp<BindersStackParamList>;

const CATEGORY_ICONS: Record<BinderCategory, keyof typeof MaterialIcons.glyphMap> = {
  [BinderCategory.RESTAURANT]: 'restaurant',
  [BinderCategory.WINE]: 'wine-bar',
  [BinderCategory.SPIRIT]: 'local-bar',
  [BinderCategory.MIXED]: 'folder',
};

export function BindersScreen() {
  const navigation = useNavigation<NavigationProp>();

  const { data: binders = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['binders'],
    queryFn: bindersApi.list,
  });

  if (isLoading) return <BinderCardSkeleton />;

  if (isError) {
    return (
      <EmptyState
        title="Something went wrong"
        description="Pull to refresh or tap to retry."
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <FlatList
      data={binders}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <EmptyState
          title="No binders yet"
          description="Your binders will appear here."
        />
      }
      renderItem={({ item }: { item: Binder }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('BinderDetail', {
              binderId: item.id,
              binderName: item.name,
            })
          }
        >
          <View style={styles.iconWrapper}>
            <MaterialIcons
              name={CATEGORY_ICONS[item.category]}
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.binderName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.noteCount}>
            {item._count?.notes || 0} notes
          </Text>
        </TouchableOpacity>
      )}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  row: { gap: spacing.md, marginBottom: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 130,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  binderName: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  noteCount: { ...typography.caption, color: colors.textTertiary },
});
