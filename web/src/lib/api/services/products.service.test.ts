import { describe, it, expect } from 'vitest';
import { normalizeProductName } from './products.service';

describe('normalizeProductName', () => {
  it('trims whitespace', () => {
    expect(normalizeProductName('  Opus One  ')).toBe('Opus One');
  });
  it('collapses multiple spaces', () => {
    expect(normalizeProductName('Opus   One')).toBe('Opus One');
  });
  it('preserves casing', () => {
    expect(normalizeProductName('opus one')).toBe('opus one');
  });
  it('returns empty string for whitespace-only input', () => {
    expect(normalizeProductName('   ')).toBe('');
  });
});
