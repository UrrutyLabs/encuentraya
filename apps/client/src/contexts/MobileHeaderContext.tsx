"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MobileHeaderState = {
  title: string | null;
  backHref: string | null;
};

type MobileHeaderContextValue = {
  title: string | null;
  backHref: string | null;
  setTitle: (title: string | null) => void;
  setBackHref: (href: string | null) => void;
  setHeader: (opts: {
    title?: string | null;
    backHref?: string | null;
  }) => void;
};

const MobileHeaderContext = createContext<MobileHeaderContextValue | null>(
  null
);

export function MobileHeaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MobileHeaderState>({
    title: null,
    backHref: null,
  });

  const setTitle = useCallback((title: string | null) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  const setBackHref = useCallback((backHref: string | null) => {
    setState((prev) => ({ ...prev, backHref }));
  }, []);

  const setHeader = useCallback(
    (opts: { title?: string | null; backHref?: string | null }) => {
      setState((prev) => ({
        ...prev,
        ...(opts.title !== undefined && { title: opts.title }),
        ...(opts.backHref !== undefined && { backHref: opts.backHref }),
      }));
    },
    []
  );

  const value = useMemo(
    () => ({
      ...state,
      setTitle,
      setBackHref,
      setHeader,
    }),
    [state.title, state.backHref, setTitle, setBackHref, setHeader]
  );

  return (
    <MobileHeaderContext.Provider value={value}>
      {children}
    </MobileHeaderContext.Provider>
  );
}

export function useMobileHeader() {
  const ctx = useContext(MobileHeaderContext);
  return ctx;
}

export function useSetMobileHeader() {
  const ctx = useContext(MobileHeaderContext);
  return ctx;
}
