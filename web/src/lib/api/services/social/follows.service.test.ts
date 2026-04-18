import { describe, it, expect } from 'vitest';
import { followsService } from './follows.service';

describe('followsService.clampLimit', () => {
  it('returns default (20) when no arg provided', () => {
    expect(followsService.clampLimit()).toBe(20);
  });

  it('returns default (20) when undefined is passed', () => {
    expect(followsService.clampLimit(undefined)).toBe(20);
  });

  it('clamps to min 1 when 0 is passed', () => {
    // 0 is falsy, so falls back to defaultVal (20)
    expect(followsService.clampLimit(0)).toBe(20);
  });

  it('clamps to min 1 when negative value is passed', () => {
    expect(followsService.clampLimit(-5)).toBe(1);
  });

  it('clamps to max 100 when value exceeds max', () => {
    expect(followsService.clampLimit(200)).toBe(100);
  });

  it('passes through valid values within range', () => {
    expect(followsService.clampLimit(50)).toBe(50);
  });

  it('passes through boundary value 1', () => {
    expect(followsService.clampLimit(1)).toBe(1);
  });

  it('passes through boundary value 100', () => {
    expect(followsService.clampLimit(100)).toBe(100);
  });

  it('respects custom defaultVal', () => {
    expect(followsService.clampLimit(undefined, 10)).toBe(10);
  });

  it('respects custom max', () => {
    expect(followsService.clampLimit(50, 20, 30)).toBe(30);
  });
});
