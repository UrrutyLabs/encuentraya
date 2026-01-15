import { useMemo } from "react";
import { useMyBookings } from "./useMyBookings";
import { BookingStatus, Category } from "@repo/domain";

/**
 * Hook to compute account statistics from bookings
 * Encapsulates statistics calculation logic
 */
export function useSettingsStats() {
  const { bookings, isLoading } = useMyBookings();

  const stats = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return {
        totalBookings: 0,
        completedBookings: 0,
        totalSpent: undefined,
        favoriteCategory: undefined,
      };
    }

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(
      (b) => b.status === BookingStatus.COMPLETED
    ).length;

    // Calculate total spent from completed bookings with totalAmount
    const totalSpent = bookings
      .filter((b) => b.status === BookingStatus.COMPLETED && b.totalAmount)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Find favorite category (most booked)
    const categoryCounts: Record<Category, number> = {} as Record<Category, number>;
    bookings.forEach((b) => {
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
    });

    const favoriteCategoryEntry = (Object.entries(categoryCounts) as [Category, number][]).reduce<[Category | undefined, number]>(
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
      totalBookings,
      completedBookings,
      totalSpent: totalSpent > 0 ? totalSpent : undefined,
      favoriteCategory,
    };
  }, [bookings]);

  return {
    stats,
    isLoading,
  };
}
