import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { productsApi } from '../../api/endpoints';
import { ProductCategory } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface ProductResult {
  id: string;
  name: string;
  category: string;
  subType: string | null;
  producer: string | null;
  vintage: number | null;
}

interface Props {
  value: { id: string; name: string } | null;
  onChange: (product: { id: string; name: string } | null) => void;
  category: ProductCategory;
  label?: string;
}

export function ProductSearchInput({ value, onChange, category, label = 'Product' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', producer: '', subType: '' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setShowCreate(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await productsApi.search(text, category);
        setResults(data);
      } catch { setResults([]); }
      setSearching(false);
    }, 400);
  }, [category]);

  const handleSelect = useCallback((product: ProductResult) => {
    onChange({ id: product.id, name: product.name });
    setQuery('');
    setResults([]);
    setShowCreate(false);
  }, [onChange]);

  const handleCreate = useCallback(async () => {
    if (!newProduct.name.trim()) return;
    setCreating(true);
    try {
      const product = await productsApi.create({
        name: newProduct.name.trim(),
        category,
        subType: newProduct.subType || undefined,
        producer: newProduct.producer || undefined,
      });
      onChange({ id: product.id, name: product.name });
      setQuery('');
      setResults([]);
      setShowCreate(false);
      setNewProduct({ name: '', producer: '', subType: '' });
    } catch { /* error handled by API layer */ }
    setCreating(false);
  }, [newProduct, category, onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery('');
    setResults([]);
  }, [onChange]);

  if (value) {
    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.selected}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{value.name}</Text>
          </View>
          <TouchableOpacity onPress={handleClear}>
            <MaterialIcons name="close" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <MaterialIcons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={`Search ${category.toLowerCase()}s...`}
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
        />
        {searching && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
      </View>

      {results.length > 0 && (
        <View style={styles.dropdown}>
          {results.slice(0, 5).map((item) => (
            <TouchableOpacity key={item.id} style={styles.result} onPress={() => handleSelect(item)}>
              <Text style={styles.resultName}>{item.name}</Text>
              {item.producer ? <Text style={styles.resultDetail}>{item.producer}</Text> : null}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.createOption}
            onPress={() => {
              setShowCreate(true);
              setNewProduct((p) => ({ ...p, name: query }));
              setResults([]);
            }}
          >
            <MaterialIcons name="add" size={16} color={colors.primary} />
            <Text style={styles.createText}>Create &quot;{query}&quot;</Text>
          </TouchableOpacity>
        </View>
      )}

      {query.length >= 2 && results.length === 0 && !searching && !showCreate && (
        <TouchableOpacity
          style={styles.createOption}
          onPress={() => {
            setShowCreate(true);
            setNewProduct((p) => ({ ...p, name: query }));
          }}
        >
          <MaterialIcons name="add" size={16} color={colors.primary} />
          <Text style={styles.createText}>Create &quot;{query}&quot;</Text>
        </TouchableOpacity>
      )}

      {showCreate && (
        <View style={styles.createForm}>
          <TextInput
            style={styles.createInput}
            placeholder="Name"
            placeholderTextColor={colors.textTertiary}
            value={newProduct.name}
            onChangeText={(t) => setNewProduct((p) => ({ ...p, name: t }))}
          />
          <TextInput
            style={styles.createInput}
            placeholder="Producer (optional)"
            placeholderTextColor={colors.textTertiary}
            value={newProduct.producer}
            onChangeText={(t) => setNewProduct((p) => ({ ...p, producer: t }))}
          />
          <TextInput
            style={styles.createInput}
            placeholder="Sub-type (optional)"
            placeholderTextColor={colors.textTertiary}
            value={newProduct.subType}
            onChangeText={(t) => setNewProduct((p) => ({ ...p, subType: t }))}
          />
          <View style={styles.createActions}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={creating}>
              {creating ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.createButtonText}>Create</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md, zIndex: 10 },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.surface },
  searchIcon: { marginLeft: spacing.md },
  input: { flex: 1, height: 48, paddingHorizontal: spacing.sm, ...typography.body, color: colors.text },
  loader: { marginRight: spacing.md },
  dropdown: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.surface, marginTop: spacing.xs, maxHeight: 240 },
  result: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  resultName: { ...typography.label, color: colors.text },
  resultDetail: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  createOption: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  createText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  createForm: { padding: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: borderRadius.md, backgroundColor: colors.surfaceElevated, marginTop: spacing.xs, gap: spacing.sm },
  createInput: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body, color: colors.text, backgroundColor: colors.surface },
  createActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.xs },
  cancelText: { ...typography.bodySmall, color: colors.textTertiary },
  createButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  createButtonText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '600' },
  selected: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: borderRadius.md, backgroundColor: colors.surfaceElevated },
  selectedInfo: { flex: 1 },
  selectedName: { ...typography.label, color: colors.text },
});
