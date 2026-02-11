import { useState, useCallback, useEffect } from "react";

export interface GeolocationPosition {
  lat: number;
  lng: number;
}

export interface UseGeolocationOptions {
  /** If true, call getCurrentPosition once on mount. */
  runOnMount?: boolean;
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  isLoading: boolean;
  getPosition: () => void;
}

export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const { runOnMount = false } = options;
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getPosition = useCallback(() => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      setError({
        code: 2,
        message: "Geolocation not supported",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      return;
    }
    setIsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setPosition(null);
        setIsLoading(false);
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, []);

  useEffect(() => {
    if (runOnMount) {
      const id = setTimeout(() => getPosition(), 0);
      return () => clearTimeout(id);
    }
  }, [runOnMount, getPosition]);

  return { position, error, isLoading, getPosition };
}
