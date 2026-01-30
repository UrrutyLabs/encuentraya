import { useState, useEffect } from "react";

/**
 * useMediaQuery Hook
 *
 * React hook for responsive design that safely handles SSR.
 * Returns true when the media query matches, false otherwise.
 *
 * @param query - CSS media query string (e.g., "(max-width: 767px)")
 * @returns boolean indicating if the media query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery("(max-width: 767px)");
 * const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
 *
 * if (isMobile) {
 *   // Mobile-specific logic
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Guard: only run on client
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value (defer to avoid synchronous setState in effect)
    setTimeout(() => {
      setMatches(mediaQuery.matches);
    }, 0);

    // Create listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (using addEventListener for better browser support)
    mediaQuery.addEventListener("change", listener);

    // Cleanup: remove listener on unmount
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}
