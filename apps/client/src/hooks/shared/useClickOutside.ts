import { useEffect, type RefObject } from "react";

/**
 * Runs a callback when the user clicks (mousedown) outside the element attached to `ref`.
 * Useful for closing dropdowns, clearing error states, or dismissing overlays.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  onClickOutside: () => void
): void {
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [ref, onClickOutside]);
}
