import { useEffect, useState } from "react";

/**
 * Hook to track page visibility (foreground/background)
 * Returns true when page is visible, false when hidden
 * Uses document.visibilityState API for web
 */
export function useAppState(): boolean {
  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    // Check initial state
    const handleVisibilityChange = () => {
      setIsForeground(!document.hidden);
    };

    // Set initial state
    setIsForeground(!document.hidden);

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isForeground;
}
