// WriteResult imported from notificationStorage — it already has a stable home
// there and adding it to types.ts would mix service-layer types with domain types.
import type { WriteResult } from './notificationStorage';

const BOUGHT_KEY = 'wbt_grocery_bought';

export function loadBoughtIds(): Set<string> {
  try {
    const raw = localStorage.getItem(BOUGHT_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set<string>(parsed.filter((v): v is string => typeof v === 'string'));
  } catch (error) {
    console.error(error);
    return new Set<string>();
  }
}

export function saveBoughtIds(ids: Set<string>): WriteResult {
  try {
    localStorage.setItem(BOUGHT_KEY, JSON.stringify([...ids]));
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
