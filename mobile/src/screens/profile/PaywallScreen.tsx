import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PurchasesOffering } from 'react-native-purchases';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '../../services/purchases';
import { useSubscriptionStore } from '../../store/subscription.store';
import { colors, typography, spacing, borderRadius } from '../../theme';

const FEATURES = [
  { icon: 'restaurant-menu' as const, title: 'Menu Decider', desc: 'Friend-powered dish recommendations' },
  { icon: 'map' as const, title: 'Area Explorer', desc: 'Map view with friend pins' },
  { icon: 'tune' as const, title: 'Advanced Filters', desc: 'Filter by rating, price, tags' },
  { icon: 'star' as const, title: 'Unlimited Friends', desc: 'Pin unlimited Gourmet Friends' },
  { icon: 'bookmark' as const, title: 'Unlimited Follows', desc: 'Follow unlimited Binders' },
  { icon: 'cloud-download' as const, title: 'Offline Mode', desc: 'Download notes for travel' },
];

export function PaywallScreen() {
  const isActive = useSubscriptionStore((s) => s.isActive);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    getOfferings().then((o) => {
      setOffering(o);
      setLoading(false);
    });
  }, []);

  const handlePurchase = async (pkg: any) => {
    setPurchasing(true);
    const result = await purchasePackage(pkg);
    setPurchasing(false);
    if (result) {
      Alert.alert('Welcome, Connoisseur!', 'Your premium features are now unlocked.');
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const result = await restorePurchases();
    setPurchasing(false);
    if (result) {
      Alert.alert('Restored', 'Your purchases have been restored.');
    } else {
      Alert.alert('No Purchases Found', 'No previous purchases were found.');
    }
  };

  const handleManage = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  if (isActive) {
    return (
      <View style={styles.container}>
        <View style={styles.activeCard}>
          <MaterialIcons name="workspace-premium" size={48} color={colors.accent} />
          <Text style={styles.activeTitle}>Connoisseur</Text>
          <Text style={styles.activeDesc}>You have full access to all premium features.</Text>
          <TouchableOpacity style={styles.manageButton} onPress={handleManage}>
            <Text style={styles.manageText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headline}>Become a Connoisseur</Text>
      <Text style={styles.subheadline}>
        Unlock the full power of your taste network
      </Text>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <MaterialIcons name={f.icon} size={24} color={colors.accent} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles.packages}>
          {offering?.availablePackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.identifier}
              style={styles.packageCard}
              onPress={() => handlePurchase(pkg)}
              disabled={purchasing}
            >
              <Text style={styles.packageTitle}>{pkg.product.title}</Text>
              <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
              <Text style={styles.packagePeriod}>
                {pkg.packageType === 'ANNUAL' ? '/year' : '/month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {purchasing && (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={{ marginTop: spacing.md }}
        />
      )}

      <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headline: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subheadline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  features: { gap: spacing.md, marginBottom: spacing.xl },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featureText: { flex: 1 },
  featureTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  featureDesc: { ...typography.caption, color: colors.textSecondary },
  packages: { gap: spacing.md, marginBottom: spacing.lg },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  packageTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  packagePrice: { ...typography.h1, color: colors.accent, marginTop: spacing.xs },
  packagePeriod: { ...typography.caption, color: colors.textSecondary },
  restoreText: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
    textDecorationLine: 'underline',
  },
  activeCard: {
    margin: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  activeTitle: { ...typography.h1, color: colors.accent },
  activeDesc: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  manageButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.md,
  },
  manageText: { ...typography.body, color: colors.primary },
});
