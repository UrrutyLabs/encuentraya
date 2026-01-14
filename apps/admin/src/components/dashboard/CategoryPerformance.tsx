"use client";

import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@repo/domain";
import { Category } from "@repo/domain";

interface CategoryPerformanceProps {
  performance: Array<{
    category: Category;
    bookings: number;
    revenue: number;
  }>;
  isLoading?: boolean;
}

const categoryLabels: Record<Category, string> = {
  [Category.PLUMBING]: "Plomería",
  [Category.ELECTRICAL]: "Electricidad",
  [Category.CLEANING]: "Limpieza",
  [Category.HANDYMAN]: "Manitas",
  [Category.PAINTING]: "Pintura",
};

export function CategoryPerformance({
  performance,
  isLoading,
}: CategoryPerformanceProps) {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-muted/30 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  // Sort by revenue descending
  const sorted = [...performance].sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = Math.max(...sorted.map((p) => p.revenue), 1);
  const totalBookings = sorted.reduce((sum, p) => sum + p.bookings, 0);
  const totalRevenue = sorted.reduce((sum, p) => sum + p.revenue, 0);

  if (performance.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <Text variant="h2">Rendimiento por Categoría</Text>
        </div>
        <Text variant="body" className="text-muted text-center py-8">
          No hay datos de categorías disponibles
        </Text>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <Text variant="h2">Rendimiento por Categoría</Text>
      </div>
      <div className="space-y-4">
        {sorted.map((item) => {
          const revenuePercentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
          const bookingsPercentage =
            totalBookings > 0 ? (item.bookings / totalBookings) * 100 : 0;

          return (
            <div key={item.category}>
              <div className="flex items-center justify-between mb-2">
                <Text variant="body" className="font-medium">
                  {categoryLabels[item.category]}
                </Text>
                <div className="text-right">
                  <Text variant="small" className="font-semibold">
                    {formatCurrency(item.revenue, "UYU", true)}
                  </Text>
                  <Text variant="xs" className="text-muted">
                    {item.bookings} reservas
                  </Text>
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${revenuePercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{Math.round(bookingsPercentage)}% reservas</span>
                  <span>{Math.round(revenuePercentage)}% ingresos</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <Text variant="body" className="font-medium">
            Total
          </Text>
          <div className="text-right">
            <Text variant="body" className="font-semibold">
              {totalBookings} reservas
            </Text>
            <Text variant="small" className="text-muted">
              {formatCurrency(totalRevenue, "UYU", true)}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
}
