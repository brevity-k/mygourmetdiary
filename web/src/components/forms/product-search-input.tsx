'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, Plus, X, Loader2 } from 'lucide-react';
import type { ProductCategory } from '@mygourmetdiary/shared-types';
import { productsApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', producer: '', subType: '' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      setShowCreate(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (text.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const data = await productsApi.search(text, category);
          setResults(data);
          setShowDropdown(true);
        } catch {
          setResults([]);
        }
        setSearching(false);
      }, 300);
    },
    [category],
  );

  const handleSelect = useCallback(
    (product: ProductResult) => {
      onChange({ id: product.id, name: product.name });
      setQuery('');
      setResults([]);
      setShowDropdown(false);
      setShowCreate(false);
    },
    [onChange],
  );

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
      setShowDropdown(false);
      setShowCreate(false);
      setNewProduct({ name: '', producer: '', subType: '' });
    } catch {
      /* error handled by API layer */
    }
    setCreating(false);
  }, [newProduct, category, onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery('');
    setResults([]);
  }, [onChange]);

  // Selected state
  if (value) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex items-center justify-between rounded-md border border-primary bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium">{value.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-2">
      {label && <Label>{label}</Label>}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={`Search ${category.toLowerCase()}s...`}
          className="pl-9 pr-9"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full rounded-md border border-border bg-background shadow-md mt-1">
          {results.slice(0, 5).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b border-border last:border-b-0"
            >
              <span className="text-sm font-medium">{item.name}</span>
              {item.producer && (
                <span className="block text-xs text-muted-foreground">{item.producer}</span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setShowCreate(true);
              setNewProduct((p) => ({ ...p, name: query }));
              setShowDropdown(false);
            }}
            className="flex items-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-primary hover:bg-muted transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create &quot;{query}&quot;
          </button>
        </div>
      )}

      {/* No results - show create option */}
      {query.length >= 2 && results.length === 0 && !searching && !showCreate && showDropdown && (
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setNewProduct((p) => ({ ...p, name: query }));
            setShowDropdown(false);
          }}
          className="flex items-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-primary rounded-md border border-border hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create &quot;{query}&quot;
        </button>
      )}

      {/* Inline create form */}
      {showCreate && (
        <div className="rounded-md border border-primary bg-background p-3 space-y-3">
          <Input
            placeholder="Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            placeholder="Producer (optional)"
            value={newProduct.producer}
            onChange={(e) => setNewProduct((p) => ({ ...p, producer: e.target.value }))}
          />
          <Input
            placeholder="Sub-type (optional)"
            value={newProduct.subType}
            onChange={(e) => setNewProduct((p) => ({ ...p, subType: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={creating || !newProduct.name.trim()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
