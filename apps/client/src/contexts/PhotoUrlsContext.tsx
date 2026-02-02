"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface PhotoUrlsContextValue {
  photoUrls: string[];
  setPhotoUrls: (urls: string[]) => void;
  clearPhotoUrls: () => void;
}

const PhotoUrlsContext = createContext<PhotoUrlsContextValue | null>(null);

export function PhotoUrlsProvider({ children }: { children: ReactNode }) {
  const [photoUrls, setPhotoUrlsState] = useState<string[]>([]);

  const setPhotoUrls = useCallback((urls: string[]) => {
    setPhotoUrlsState(urls);
  }, []);

  const clearPhotoUrls = useCallback(() => {
    setPhotoUrlsState([]);
  }, []);

  const value: PhotoUrlsContextValue = {
    photoUrls,
    setPhotoUrls,
    clearPhotoUrls,
  };

  return (
    <PhotoUrlsContext.Provider value={value}>
      {children}
    </PhotoUrlsContext.Provider>
  );
}

export function usePhotoUrls(): PhotoUrlsContextValue {
  const ctx = useContext(PhotoUrlsContext);
  if (!ctx) {
    throw new Error("usePhotoUrls must be used within PhotoUrlsProvider");
  }
  return ctx;
}

export function usePhotoUrlsOptional(): PhotoUrlsContextValue | null {
  return useContext(PhotoUrlsContext);
}
