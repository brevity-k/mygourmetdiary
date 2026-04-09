import React from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { CommunityView } from '../../components/community/CommunityView';
import { ProductHero } from '../../components/community/ProductHero';
import { useUIStore } from '../../store/ui.store';
import { SearchStackParamList } from '../../navigation/types';
import { Product } from '../../types';

type RouteType = RouteProp<SearchStackParamList, 'ProductCommunity'>;
type NavProp = NativeStackNavigationProp<SearchStackParamList>;

export function ProductCommunityScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavProp>();
  const { productId, productName } = route.params;
  const openNoteCreation = useUIStore((s) => s.openNoteCreation);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: productName });
  }, [navigation, productName]);

  const productQuery = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId),
  });

  if (productQuery.isLoading) return <LoadingSpinner />;

  if (productQuery.isError || !productQuery.data) {
    return (
      <EmptyState
        title="Something went wrong"
        description="Could not load product details."
        actionLabel="Retry"
        onAction={() => productQuery.refetch()}
      />
    );
  }

  const product = productQuery.data;

  return (
    <CommunityView
      subjectType="product"
      subjectId={productId}
      heroComponent={(stats) => (
        <ProductHero product={product} stats={stats} />
      )}
      onGourmetPress={(userId) =>
        navigation.navigate('UserProfile', { userId })
      }
      onNotePress={(noteId) =>
        navigation.navigate('NoteDetail', { noteId })
      }
      onWriteNote={() => openNoteCreation()}
    />
  );
}
