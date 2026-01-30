import { useMemo } from "react";
import { useMyOrders } from "../order";
import { useCategories } from "../category";
import { OrderStatus, toMajorUnits } from "@repo/domain";

/**
 * Hook to compute account statistics from orders
 * Encapsulates statistics calculation logic
 */
export function useSettingsStats() {
  const { orders, isLoading: ordersLoading } = useMyOrders();
  const { categories, isLoading: categoriesLoading } = useCategories();

  const stats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalJobs: 0,
        completedJobs: 0,
        totalSpent: undefined,
        favoriteCategory: undefined,
      };
    }

    const totalJobs = orders.length;
    const completedJobs = orders.filter(
      (o) => o.status === OrderStatus.COMPLETED
    ).length;

    // Calculate total spent from completed orders with totalAmount
    // All amounts are in minor units, convert to major units for display
    const totalSpentMinor = orders
      .filter((o) => o.status === OrderStatus.COMPLETED && o.totalAmount)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalSpent = totalSpentMinor > 0 ? toMajorUnits(totalSpentMinor) : 0;

    // Find favorite category (most ordered) by categoryId
    const categoryCounts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.categoryId) {
        categoryCounts[o.categoryId] = (categoryCounts[o.categoryId] || 0) + 1;
      }
    });

    const favoriteCategoryEntry = Object.entries(categoryCounts).reduce<
      [string | undefined, number]
    >(
      (max, [categoryId, count]) => {
        return count > max[1] ? [categoryId, count] : max;
      },
      [undefined, 0]
    );

    // Map categoryId to category name
    const favoriteCategory = favoriteCategoryEntry[0]
      ? categories.find((c) => c.id === favoriteCategoryEntry[0])?.name
      : undefined;

    return {
      totalJobs,
      completedJobs,
      totalSpent: totalSpent > 0 ? totalSpent : undefined,
      favoriteCategory,
    };
  }, [orders, categories]);

  return {
    stats,
    isLoading: ordersLoading || categoriesLoading,
  };
}
