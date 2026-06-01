import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadBoughtIds, saveBoughtIds } from '../groceryStorage';
import { createMockStorage } from '../../test/mockLocalStorage';

const mockStorage = createMockStorage();

beforeEach(() => {
  mockStorage.clear();
  vi.stubGlobal('localStorage', mockStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const BOUGHT_KEY = 'wbt_grocery_bought';

// ─── loadBoughtIds ─────────────────────────────────────────────────────────────

describe('loadBoughtIds', () => {
  it('returns empty Set when key does not exist', () => {
    const result = loadBoughtIds();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns correct Set<string> when key has valid JSON array', () => {
    mockStorage.setItem(BOUGHT_KEY, JSON.stringify(['id-1', 'id-2', 'id-3']));
    const result = loadBoughtIds();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(3);
    expect(result.has('id-1')).toBe(true);
    expect(result.has('id-2')).toBe(true);
    expect(result.has('id-3')).toBe(true);
  });

  it('returns empty Set when localStorage.getItem throws (SecurityError)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new DOMException('SecurityError'); },
    });
    const result = loadBoughtIds();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('logs an error to console when getItem throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new DOMException('SecurityError'); },
    });
    loadBoughtIds();
    expect(consoleSpy).toHaveBeenCalledOnce();
    consoleSpy.mockRestore();
  });

  it('returns empty Set when stored value is malformed JSON', () => {
    mockStorage.setItem(BOUGHT_KEY, 'not-valid-json{{{');
    const result = loadBoughtIds();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns empty Set when stored value is valid JSON but not an array', () => {
    mockStorage.setItem(BOUGHT_KEY, JSON.stringify({ id: 'abc' }));
    const result = loadBoughtIds();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('uses the exact key wbt_grocery_bought', () => {
    mockStorage.setItem(BOUGHT_KEY, JSON.stringify(['abc']));
    mockStorage.setItem('other_key', JSON.stringify(['xyz']));
    const result = loadBoughtIds();
    expect(result.has('abc')).toBe(true);
    expect(result.has('xyz')).toBe(false);
  });
});

// ─── saveBoughtIds ─────────────────────────────────────────────────────────────

describe('saveBoughtIds', () => {
  it('writes serialised array to wbt_grocery_bought and returns { success: true }', () => {
    const ids = new Set(['id-a', 'id-b']);
    const result = saveBoughtIds(ids);
    expect(result).toEqual({ success: true });
    const stored = JSON.parse(mockStorage.getItem(BOUGHT_KEY) ?? '[]') as string[];
    expect(stored).toHaveLength(2);
    expect(stored).toContain('id-a');
    expect(stored).toContain('id-b');
  });

  it('returns { success: false } when localStorage.setItem throws (QuotaExceededError)', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => { throw new DOMException('QuotaExceededError'); },
    });
    const result = saveBoughtIds(new Set(['id-x']));
    expect(result).toEqual({ success: false });
  });

  it('logs an error to console when setItem throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('localStorage', {
      setItem: () => { throw new DOMException('QuotaExceededError'); },
    });
    saveBoughtIds(new Set(['id-x']));
    expect(consoleSpy).toHaveBeenCalledOnce();
    consoleSpy.mockRestore();
  });

  it('correctly round-trips a multi-item Set (write then read returns equivalent Set)', () => {
    const original = new Set(['alpha', 'beta', 'gamma']);
    saveBoughtIds(original);
    const loaded = loadBoughtIds();
    expect(loaded.size).toBe(original.size);
    for (const id of original) {
      expect(loaded.has(id)).toBe(true);
    }
  });

  it('writes empty array for empty Set', () => {
    const result = saveBoughtIds(new Set());
    expect(result).toEqual({ success: true });
    const stored = JSON.parse(mockStorage.getItem(BOUGHT_KEY) ?? 'null') as string[];
    expect(stored).toEqual([]);
  });
});
