import { HistoryItem } from '@/types/tts';

export const HISTORY_STORAGE_KEY = 'tts_history';

/**
 * Safely retrieves history items from localStorage
 */
export function getStoredHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read history from localStorage:', err);
    return [];
  }
}

/**
 * Safely saves history items into localStorage, pruning oldest items
 * if a QuotaExceededError is encountered (5MB browser limit).
 */
export function saveHistorySafely(items: HistoryItem[]): HistoryItem[] {
  if (typeof window === 'undefined') return items;

  let currentItems = [...items];

  while (currentItems.length > 0) {
    try {
      const payload = JSON.stringify(currentItems);
      localStorage.setItem(HISTORY_STORAGE_KEY, payload);
      return currentItems;
    } catch (err: any) {
      // Check if it's a quota exceeded error
      const isQuotaError =
        err?.name === 'QuotaExceededError' ||
        err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err?.code === 22 ||
        err?.code === 1014;

      if (isQuotaError && currentItems.length > 1) {
        console.warn('LocalStorage quota exceeded. Pruning oldest generation clip...');
        // Remove the oldest item (which is at the end of the array)
        currentItems.pop();
      } else {
        console.error('Failed to save to localStorage:', err);
        break;
      }
    }
  }

  return currentItems;
}
