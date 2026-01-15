import { useState, useEffect } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

/**
 * Hook to track network connectivity status
 * Returns true when online, false when offline
 */
export function useNetworkStatus(): {
  isOnline: boolean;
  isOffline: boolean;
  isChecking: boolean;
} {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state);
    });

    // Get initial state
    NetInfo.fetch().then(setNetworkState);

    return () => {
      unsubscribe();
    };
  }, []);

  const isOnline = networkState?.isConnected ?? true; // Default to online if unknown
  const isOffline = !isOnline;
  const isChecking = networkState === null;

  return {
    isOnline,
    isOffline,
    isChecking,
  };
}
