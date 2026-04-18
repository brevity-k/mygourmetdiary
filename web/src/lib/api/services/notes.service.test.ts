import { describe, it, expect } from 'vitest';
import { notesService } from './notes.service';

describe('notesService.clampLimit', () => {
  it('returns default (20) when no arg provided', () => {
    expect(notesService.clampLimit()).toBe(20);
  });

  it('returns default (20) when undefined is passed', () => {
    expect(notesService.clampLimit(undefined)).toBe(20);
  });

  it('clamps to min 1 when 0 is passed', () => {
    // 0 is falsy, so falls back to defaultVal (20)
    expect(notesService.clampLimit(0)).toBe(20);
  });

  it('clamps to min 1 when negative value is passed', () => {
    expect(notesService.clampLimit(-5)).toBe(1);
  });

  it('clamps to max 100 when value exceeds max', () => {
    expect(notesService.clampLimit(200)).toBe(100);
  });

  it('passes through valid values within range', () => {
    expect(notesService.clampLimit(50)).toBe(50);
  });

  it('passes through boundary value 1', () => {
    expect(notesService.clampLimit(1)).toBe(1);
  });

  it('passes through boundary value 100', () => {
    expect(notesService.clampLimit(100)).toBe(100);
  });

  it('respects custom defaultVal', () => {
    expect(notesService.clampLimit(undefined, 10)).toBe(10);
  });

  it('respects custom max', () => {
    expect(notesService.clampLimit(50, 20, 30)).toBe(30);
  });
});
