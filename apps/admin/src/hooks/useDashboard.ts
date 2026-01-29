import { useMemo } from "react";
import { useOrders } from "./useOrders";
import { usePayments } from "./usePayments";
import { usePayouts } from "./usePayouts";
import { usePros } from "./usePros";
import { useCategories } from "./useCategories";
import { OrderStatus, PaymentStatus, type Category } from "@repo/domain";

export function useDashboard() {
  // Fetch all data (we'll aggregate on the frontend for Phase 1)
  // Note: API limits orders/payments/pros to 100, payouts allows up to 1000
  const { data: orders, isLoading: ordersLoading } = useOrders({
    limit: 100,
  });
  const { data: payments, isLoading: paymentsLoading } = usePayments({
    limit: 100,
  });
  const { data: payouts, isLoading: payoutsLoading } = usePayouts(1000);
  const { data: pros, isLoading: prosLoading } = usePros({ limit: 100 });
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const isLoading =
    ordersLoading ||
    paymentsLoading ||
    payoutsLoading ||
    prosLoading ||
    categoriesLoading;

  // Calculate stats
  const stats = useMemo(() => {
    if (!orders || !payments || !payouts || !pros || !categories) {
      return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Orders stats
    const ordersToday = orders.filter(
      (o) => new Date(o.createdAt) >= today
    ).length;
    const ordersThisWeek = orders.filter(
      (o) => new Date(o.createdAt) >= weekAgo
    ).length;
    const ordersThisMonth = orders.filter(
      (o) => new Date(o.createdAt) >= monthAgo
    ).length;

    // Revenue stats (from captured payments)
    const capturedPayments = payments.filter(
      (p) => p.status === PaymentStatus.CAPTURED
    );
    const revenueToday = capturedPayments
      .filter((p) => new Date(p.updatedAt) >= today)
      .reduce((sum, p) => sum + (p.amountCaptured || 0), 0);
    const revenueThisWeek = capturedPayments
      .filter((p) => new Date(p.updatedAt) >= weekAgo)
      .reduce((sum, p) => sum + (p.amountCaptured || 0), 0);
    const revenueThisMonth = capturedPayments
      .filter((p) => new Date(p.updatedAt) >= monthAgo)
      .reduce((sum, p) => sum + (p.amountCaptured || 0), 0);

    // Pending payouts
    const pendingPayouts = payouts.filter(
      (p) => p.status === "CREATED" || p.status === "SENT"
    );
    const pendingPayoutsAmount = pendingPayouts.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // Active pros
    const activePros = pros.filter((p) => p.status === "active").length;

    // Order status breakdown (will be fully migrated in Phase 12.5)
    const orderStatusBreakdown = {
      draft: orders.filter((o) => o.status === OrderStatus.DRAFT).length,
      pending_pro_confirmation: orders.filter(
        (o) => o.status === OrderStatus.PENDING_PRO_CONFIRMATION
      ).length,
      accepted: orders.filter((o) => o.status === OrderStatus.ACCEPTED).length,
      confirmed: orders.filter((o) => o.status === OrderStatus.CONFIRMED)
        .length,
      in_progress: orders.filter((o) => o.status === OrderStatus.IN_PROGRESS)
        .length,
      awaiting_client_approval: orders.filter(
        (o) => o.status === OrderStatus.AWAITING_CLIENT_APPROVAL
      ).length,
      disputed: orders.filter((o) => o.status === OrderStatus.DISPUTED).length,
      completed: orders.filter((o) => o.status === OrderStatus.COMPLETED)
        .length,
      paid: orders.filter((o) => o.status === OrderStatus.PAID).length,
      canceled: orders.filter((o) => o.status === OrderStatus.CANCELED).length,
    };

    // Recent activity (last 10 items)
    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    const recentPayments = [...payments]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 5);

    const recentPayouts = [...payouts]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    // Revenue trends (last 7 days)
    const revenueTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRevenue = capturedPayments
        .filter((p) => {
          const paymentDate = new Date(p.updatedAt);
          return paymentDate >= date && paymentDate < nextDate;
        })
        .reduce((sum, p) => sum + (p.amountCaptured || 0), 0);

      revenueTrends.push({
        date: date.toLocaleDateString("es-UY", {
          month: "short",
          day: "numeric",
        }),
        revenue: dayRevenue,
      });
    }

    // Payment status breakdown
    const paymentStatusBreakdown = {
      CREATED: payments.filter((p) => p.status === PaymentStatus.CREATED)
        .length,
      REQUIRES_ACTION: payments.filter(
        (p) => p.status === PaymentStatus.REQUIRES_ACTION
      ).length,
      AUTHORIZED: payments.filter((p) => p.status === PaymentStatus.AUTHORIZED)
        .length,
      CAPTURED: payments.filter((p) => p.status === PaymentStatus.CAPTURED)
        .length,
      FAILED: payments.filter((p) => p.status === PaymentStatus.FAILED).length,
      CANCELLED: payments.filter((p) => p.status === PaymentStatus.CANCELLED)
        .length,
      REFUNDED: payments.filter((p) => p.status === PaymentStatus.REFUNDED)
        .length,
    };

    // Payment status amounts
    const paymentStatusAmounts = {
      CREATED: payments
        .filter((p) => p.status === PaymentStatus.CREATED)
        .reduce((sum, p) => sum + (p.amountEstimated || 0), 0),
      REQUIRES_ACTION: payments
        .filter((p) => p.status === PaymentStatus.REQUIRES_ACTION)
        .reduce((sum, p) => sum + (p.amountEstimated || 0), 0),
      AUTHORIZED: payments
        .filter((p) => p.status === PaymentStatus.AUTHORIZED)
        .reduce((sum, p) => sum + (p.amountAuthorized || 0), 0),
      CAPTURED: payments
        .filter((p) => p.status === PaymentStatus.CAPTURED)
        .reduce((sum, p) => sum + (p.amountCaptured || 0), 0),
      FAILED: payments
        .filter((p) => p.status === PaymentStatus.FAILED)
        .reduce((sum, p) => sum + (p.amountEstimated || 0), 0),
      CANCELLED: payments
        .filter((p) => p.status === PaymentStatus.CANCELLED)
        .reduce((sum, p) => sum + (p.amountEstimated || 0), 0),
      REFUNDED: payments
        .filter((p) => p.status === PaymentStatus.REFUNDED)
        .reduce((sum, p) => sum + (p.amountCaptured || 0), 0),
    };

    // Payout status breakdown
    const payoutStatusBreakdown = {
      CREATED: payouts.filter((p) => p.status === "CREATED").length,
      SENT: payouts.filter((p) => p.status === "SENT").length,
      SETTLED: payouts.filter((p) => p.status === "SETTLED").length,
      FAILED: payouts.filter((p) => p.status === "FAILED").length,
    };

    const payoutStatusAmounts = {
      CREATED: payouts
        .filter((p) => p.status === "CREATED")
        .reduce((sum, p) => sum + p.amount, 0),
      SENT: payouts
        .filter((p) => p.status === "SENT")
        .reduce((sum, p) => sum + p.amount, 0),
      SETTLED: payouts
        .filter((p) => p.status === "SETTLED")
        .reduce((sum, p) => sum + p.amount, 0),
      FAILED: payouts
        .filter((p) => p.status === "FAILED")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    // Category performance
    // Create a map of categoryId -> Category for quick lookup
    const categoryMapById = new Map<string, Category>();
    categories.forEach((category) => {
      // Only include active, non-deleted categories
      if (category.isActive && !category.deletedAt) {
        categoryMapById.set(category.id, category);
      }
    });

    // Aggregate orders and revenue by category
    const categoryPerformanceMap = new Map<
      string,
      { orders: number; revenue: number }
    >();
    orders.forEach((order) => {
      const category = categoryMapById.get(order.categoryId);
      // Skip orders with soft-deleted or inactive categories
      if (!category) {
        return;
      }

      const existing = categoryPerformanceMap.get(order.categoryId) || {
        orders: 0,
        revenue: 0,
      };
      const orderRevenue = order.totalAmount || 0;
      categoryPerformanceMap.set(order.categoryId, {
        orders: existing.orders + 1,
        revenue: existing.revenue + orderRevenue,
      });
    });

    // Convert map to array with Category objects
    const categoryPerformance: Array<{
      category: Category;
      orders: number;
      revenue: number;
    }> = Array.from(categoryPerformanceMap.entries())
      .map(([categoryId, data]) => {
        const category = categoryMapById.get(categoryId);
        if (!category) {
          return null;
        }
        return {
          category,
          orders: data.orders,
          revenue: data.revenue,
        };
      })
      .filter(
        (
          item
        ): item is {
          category: Category;
          orders: number;
          revenue: number;
        } => item !== null
      )
      // Sort by revenue descending
      .sort((a, b) => b.revenue - a.revenue);

    return {
      orders: {
        today: ordersToday,
        thisWeek: ordersThisWeek,
        thisMonth: ordersThisMonth,
        total: orders.length,
      },
      revenue: {
        today: revenueToday,
        thisWeek: revenueThisWeek,
        thisMonth: revenueThisMonth,
      },
      payouts: {
        pending: pendingPayouts.length,
        pendingAmount: pendingPayoutsAmount,
        total: payouts.length,
      },
      pros: {
        active: activePros,
        total: pros.length,
      },
      orderStatusBreakdown,
      revenueTrends,
      paymentStatusBreakdown,
      paymentStatusAmounts,
      payoutStatusBreakdown,
      payoutStatusAmounts,
      categoryPerformance,
      recentOrders,
      recentPayments,
      recentPayouts,
    };
  }, [orders, payments, payouts, pros, categories]);

  return {
    stats,
    isLoading,
  };
}
