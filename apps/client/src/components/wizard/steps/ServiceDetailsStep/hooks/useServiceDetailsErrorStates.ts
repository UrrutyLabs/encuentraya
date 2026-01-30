import { useMemo } from "react";
import type { Category, Pro } from "@repo/domain";

interface UseServiceDetailsErrorStatesProps {
  isLoadingRebook: boolean;
  isLoadingCategory: boolean;
  isLoadingPro: boolean;
  isLoadingConfig: boolean;
  effectiveProId: string | null;
  pro: Pro | null;
  isCategoryPreSelected: boolean;
  selectedCategory: Category | null;
}

interface UseServiceDetailsErrorStatesReturn {
  isLoading: boolean;
  hasProId: boolean;
  hasPro: boolean;
  hasCategory: boolean;
  shouldShowErrors: boolean;
}

/**
 * Hook to manage error states for ServiceDetailsStep
 *
 * Combines loading states and checks for required data
 * to determine if error states should be shown.
 *
 * @param props - Configuration object
 * @returns Error state flags
 */
export function useServiceDetailsErrorStates({
  isLoadingRebook,
  isLoadingCategory,
  isLoadingPro,
  isLoadingConfig,
  effectiveProId,
  pro,
  isCategoryPreSelected,
  selectedCategory,
}: UseServiceDetailsErrorStatesProps): UseServiceDetailsErrorStatesReturn {
  const isLoading = useMemo(() => {
    return (
      isLoadingRebook || isLoadingCategory || isLoadingPro || isLoadingConfig
    );
  }, [isLoadingRebook, isLoadingCategory, isLoadingPro, isLoadingConfig]);

  const hasProId = !!effectiveProId;
  const hasPro = !!pro;
  const hasCategory = isCategoryPreSelected && !!selectedCategory;

  const shouldShowErrors = isLoading || !hasProId || !hasPro || !hasCategory;

  return {
    isLoading,
    hasProId,
    hasPro,
    hasCategory,
    shouldShowErrors,
  };
}
