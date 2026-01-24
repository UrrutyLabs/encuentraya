import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Hook to track app state (foreground/background)
 * Returns true when app is in foreground, false when in background
 */
export function useAppState(): boolean {
  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    // Check initial state
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        setIsForeground(nextAppState === "active");
      }
    );

    // Set initial state
    setIsForeground(AppState.currentState === "active");

    return () => {
      subscription.remove();
    };
  }, []);

  return isForeground;
}
