/**
 * React Query persistence configuration
 * Persists query cache to AsyncStorage for offline support
 */

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorage persister for React Query
 * Persists query cache to device storage
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "REACT_QUERY_OFFLINE_CACHE",
  // Throttle persistence to avoid excessive writes
  throttleTime: 1000,
});
