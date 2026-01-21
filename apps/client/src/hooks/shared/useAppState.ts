import { useEffect, useState } from "react";

/**
 * Hook to track page visibility (foreground/background)
 * Returns true when page is visible, false when hidden
 * Uses document.visibilityState API for web
 */
export function useAppState(): boolean {
  // Initialize state with current visibility state
  const [isForeground, setIsForeground] = useState(() => {
    if (typeof document !== "undefined") {
      return !document.hidden;
    }
    return true;
  });

  useEffect(() => {
    // Check initial state
    const handleVisibilityChange = () => {
      setIsForeground(!document.hidden);
    };

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isForeground;
}
