import { useState, useMemo, useEffect, useRef, startTransition } from "react";
import { useRebookTemplate } from "@/hooks/order";
import { useCategoryBySlug } from "@/hooks/category";
import { useCategory } from "@/hooks/category";
import { useSubcategoryBySlugAndCategoryId } from "@/hooks/subcategory";
import type { Category, Subcategory } from "@repo/domain";

interface RebookValues {
  categorySlug: string;
  address: string;
  hours: string;
}

interface UseServiceDetailsPreselectedValuesProps {
  rebookFrom?: string | null;
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  proId?: string | null;
}

interface UseServiceDetailsPreselectedValuesReturn {
  // Derived values
  effectiveProId: string | null;
  selectedCategory: Category | null;
  selectedSubcategory: Subcategory | null;
  categoryId: string | "";
  isCategoryPreSelected: boolean;

  // Rebook-specific
  rebookValues: RebookValues | null;

  // Loading states
  isLoadingRebook: boolean;
  isLoadingCategory: boolean;

  // Setters
  setCategoryId: (id: string | "") => void;
}

/**
 * Hook to handle preselected values for ServiceDetailsStep
 *
 * Manages:
 * - Rebook template fetching and value derivation
 * - URL-based category/subcategory fetching
 * - Effective proId determination (rebook vs URL)
 * - Category state synchronization
 *
 * @param props - Configuration object with rebookFrom, categorySlug, subcategorySlug, proId
 * @returns Object with all derived values, loading states, and setters
 */
export function useServiceDetailsPreselectedValues({
  rebookFrom,
  categorySlug,
  subcategorySlug,
  proId,
}: UseServiceDetailsPreselectedValuesProps): UseServiceDetailsPreselectedValuesReturn {
  // Fetch rebook template if rebookFrom is present
  const { data: rebookTemplate, isLoading: isLoadingRebook } =
    useRebookTemplate(rebookFrom || undefined);

  // Fetch category from rebook template to get slug
  const { category: rebookCategory, isLoading: isLoadingRebookCategory } =
    useCategory(rebookTemplate?.categoryId || undefined);

  // Fetch category by slug from URL
  const { category: urlCategory, isLoading: isLoadingUrlCategory } =
    useCategoryBySlug(categorySlug || undefined);

  // Fetch subcategory by slug from URL
  const { subcategory: urlSubcategory, isLoading: isLoadingUrlSubcategory } =
    useSubcategoryBySlugAndCategoryId(
      subcategorySlug || undefined,
      urlCategory?.id
    );

  // Derive initial values from rebook template
  const rebookValues = useMemo((): RebookValues | null => {
    if (rebookTemplate && rebookCategory) {
      return {
        categorySlug: rebookCategory.slug,
        address: rebookTemplate.addressText,
        hours: (rebookTemplate.estimatedHours ?? 0).toString(),
      };
    }
    return null;
  }, [rebookTemplate, rebookCategory]);

  // Determine proId: from rebook template or query param
  const effectiveProId = useMemo(() => {
    return rebookTemplate?.proProfileId || proId || null;
  }, [rebookTemplate?.proProfileId, proId]);

  // Use category from URL or rebook template
  const selectedCategory = useMemo(() => {
    return urlCategory || rebookCategory || null;
  }, [urlCategory, rebookCategory]);

  // Check if category/subcategory are pre-selected from URL (read-only mode)
  const isCategoryPreSelected = !!categorySlug;

  // Category ID state - initialized from selected category
  const [categoryId, setCategoryIdState] = useState<string | "">(
    selectedCategory?.id || ""
  );

  // Track previous values to update state only when they first become available
  const prevRebookValuesRef = useRef(rebookValues);

  // Update categoryId when rebook template or URL category first becomes available
  useEffect(() => {
    const prevValues = prevRebookValuesRef.current;
    if (rebookValues && prevValues !== rebookValues) {
      prevRebookValuesRef.current = rebookValues;
      startTransition(() => {
        if (selectedCategory && categoryId !== selectedCategory.id) {
          setCategoryIdState(selectedCategory.id);
        }
      });
    } else if (selectedCategory && categoryId !== selectedCategory.id) {
      startTransition(() => {
        setCategoryIdState(selectedCategory.id);
      });
    }
  }, [rebookValues, selectedCategory, categoryId]);

  // Wrapper for setCategoryId that can trigger callbacks
  const setCategoryId = (id: string | "") => {
    setCategoryIdState(id);
  };

  // Combined loading state
  const isLoadingCategory =
    isLoadingRebook ||
    isLoadingRebookCategory ||
    isLoadingUrlCategory ||
    isLoadingUrlSubcategory;

  return {
    // Derived values
    effectiveProId,
    selectedCategory,
    selectedSubcategory: urlSubcategory || null,
    categoryId,
    isCategoryPreSelected,

    // Rebook-specific
    rebookValues,

    // Loading states
    isLoadingRebook,
    isLoadingCategory,

    // Setters
    setCategoryId,
  };
}
