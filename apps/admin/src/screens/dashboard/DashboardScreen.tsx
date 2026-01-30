"use client";

import { Text } from "@repo/ui";
import { useDashboard } from "@/hooks/useDashboard";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { OrderStatusBreakdown } from "@/components/dashboard/OrderStatusBreakdown";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { PaymentStatusSummary } from "@/components/dashboard/PaymentStatusSummary";
import { PayoutStatusSummary } from "@/components/dashboard/PayoutStatusSummary";
import { CategoryPerformance } from "@/components/dashboard/CategoryPerformance";

export function DashboardScreen() {
  const { stats, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Dashboard</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-muted/30 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Dashboard</Text>
        <Text variant="body" className="text-muted">
          No se pudieron cargar las estadísticas
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Text variant="h1">Dashboard</Text>

      {/* Overview Cards */}
      <OverviewCards
        orders={stats.orders}
        revenue={stats.revenue}
        payouts={stats.payouts}
        pros={stats.pros}
        isLoading={isLoading}
      />

      {/* Charts and Breakdowns Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderStatusBreakdown
          breakdown={stats.orderStatusBreakdown}
          isLoading={isLoading}
        />
        <RevenueTrendChart trends={stats.revenueTrends} isLoading={isLoading} />
      </div>

      {/* Status Summaries Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentStatusSummary
          breakdown={stats.paymentStatusBreakdown}
          amounts={stats.paymentStatusAmounts}
          isLoading={isLoading}
        />
        <PayoutStatusSummary
          breakdown={stats.payoutStatusBreakdown}
          amounts={stats.payoutStatusAmounts}
          isLoading={isLoading}
        />
      </div>

      {/* Category Performance */}
      <CategoryPerformance
        performance={stats.categoryPerformance}
        isLoading={isLoading}
      />

      {/* Recent Activity */}
      <RecentActivityFeed
        recentOrders={stats.recentOrders}
        recentPayments={stats.recentPayments}
        recentPayouts={stats.recentPayouts}
        isLoading={isLoading}
      />
    </div>
  );
}
