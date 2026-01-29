"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface WizardState {
  proId: string | null;
  categorySlug: string | null; // Category slug for URL (user-friendly)
  date: string | null;
  time: string | null;
  address: string | null;
  hours: string | null;
  rebookFrom: string | null;
}

export function useWizardState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state: WizardState = useMemo(
    () => ({
      proId: searchParams.get("proId"),
      categorySlug: searchParams.get("category") || null, // Use "category" param name for slug
      date: searchParams.get("date"),
      time: searchParams.get("time"),
      address: searchParams.get("address"),
      hours: searchParams.get("hours"),
      rebookFrom: searchParams.get("rebookFrom"),
    }),
    [searchParams]
  );

  const updateState = useCallback(
    (updates: Partial<WizardState>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          // Map categorySlug to "category" param name in URL
          if (key === "categorySlug") {
            params.delete("category");
          } else {
            params.delete(key);
          }
        } else {
          // Map categorySlug to "category" param name in URL
          if (key === "categorySlug") {
            params.set("category", String(value));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
    },
    [searchParams, router, pathname]
  );

  const navigateToStep = useCallback(
    (step: string, additionalParams?: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Preserve existing state
      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          if (value) {
            // Map categorySlug to "category" param name in URL
            if (key === "categorySlug") {
              params.set("category", value);
            } else {
              params.set(key, value);
            }
          }
        });
      }

      const queryString = params.toString();
      router.push(
        `/book/wizard/${step}${queryString ? `?${queryString}` : ""}`
      );
    },
    [searchParams, router]
  );

  const clearState = useCallback(() => {
    router.push("/book");
  }, [router]);

  return {
    state,
    updateState,
    navigateToStep,
    clearState,
  };
}
