"use client";

import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@repo/domain";

interface RevenueTrendChartProps {
  trends: Array<{
    date: string;
    revenue: number;
  }>;
  isLoading?: boolean;
}

export function RevenueTrendChart({ trends, isLoading }: RevenueTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/3 mb-4" />
        <div className="h-48 bg-muted/30 rounded" />
      </Card>
    );
  }

  const maxRevenue = Math.max(...trends.map((t) => t.revenue), 1);
  const totalRevenue = trends.reduce((sum, t) => sum + t.revenue, 0);
  const avgRevenue = totalRevenue / trends.length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          <Text variant="h2">Tendencia de Ingresos</Text>
        </div>
        <Text variant="small" className="text-muted">
          Últimos 7 días
        </Text>
      </div>

      {/* Chart */}
      <div className="h-48 flex items-end justify-between gap-2 mb-4">
        {trends.map((trend, index) => {
          const height = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 0;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end h-full">
                <div
                  className="w-full bg-primary rounded-t transition-all hover:opacity-80 cursor-pointer"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={formatCurrency(trend.revenue, "UYU", true)}
                />
              </div>
              <Text variant="xs" className="text-muted text-center">
                {trend.date.split(" ")[0]}
              </Text>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <Text variant="small" className="text-muted">
            Promedio diario
          </Text>
          <Text variant="body" className="font-semibold">
            {formatCurrency(avgRevenue, "UYU", true)}
          </Text>
        </div>
        <div className="text-right">
          <Text variant="small" className="text-muted">
            Total 7 días
          </Text>
          <Text variant="body" className="font-semibold">
            {formatCurrency(totalRevenue, "UYU", true)}
          </Text>
        </div>
      </div>
    </Card>
  );
}
