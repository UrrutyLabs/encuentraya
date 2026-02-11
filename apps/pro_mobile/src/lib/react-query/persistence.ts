/**
 * React Query persistence configuration
 * Persists query cache to AsyncStorage for offline support
 */

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const REACT_QUERY_CACHE_KEY = "REACT_QUERY_OFFLINE_CACHE";

/**
 * AsyncStorage persister for React Query
 * Persists query cache to device storage
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: REACT_QUERY_CACHE_KEY,
  // Throttle persistence to avoid excessive writes
  throttleTime: 1000,
});

/**
 * Clear all local storage (AsyncStorage). Call on sign out so the next user
 * or same user gets a clean slate (no persisted query cache or other app data).
 * Removes the React Query cache key first, then clears everything (including
 * any Supabase or other app keys).
 */
export async function clearLocalStorageOnSignOut(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REACT_QUERY_CACHE_KEY);
  } catch {
    // ignore
  }
  await AsyncStorage.clear();
}
