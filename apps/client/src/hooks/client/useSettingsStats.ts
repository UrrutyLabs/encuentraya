import { useMemo } from "react";
import { useMyOrders } from "../order";
import { OrderStatus, Category } from "@repo/domain";

/**
 * Hook to compute account statistics from orders
 * Encapsulates statistics calculation logic
 */
export function useSettingsStats() {
  const { orders, isLoading } = useMyOrders();

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
    const totalSpent = orders
      .filter((o) => o.status === OrderStatus.COMPLETED && o.totalAmount)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Find favorite category (most ordered)
    const categoryCounts: Record<Category, number> = {} as Record<
      Category,
      number
    >;
    orders.forEach((o) => {
      categoryCounts[o.category] = (categoryCounts[o.category] || 0) + 1;
    });

    const favoriteCategoryEntry = (
      Object.entries(categoryCounts) as [Category, number][]
    ).reduce<[Category | undefined, number]>(
      (max, [category, count]) => {
        return count > max[1] ? [category, count] : max;
      },
      [undefined, 0]
    );

    // Map category enum to Spanish label
    const categoryLabels: Record<Category, string> = {
      [Category.PLUMBING]: "Plomería",
      [Category.ELECTRICAL]: "Electricidad",
      [Category.CLEANING]: "Limpieza",
      [Category.HANDYMAN]: "Arreglos generales",
      [Category.PAINTING]: "Pintura",
    };

    const favoriteCategory = favoriteCategoryEntry[0]
      ? categoryLabels[favoriteCategoryEntry[0] as Category]
      : undefined;

    return {
      totalJobs,
      completedJobs,
      totalSpent: totalSpent > 0 ? totalSpent : undefined,
      favoriteCategory,
    };
  }, [orders]);

  return {
    stats,
    isLoading,
  };
}
