import { useMemo } from "react";
import { useBookings } from "./useBookings";
import { usePayments } from "./usePayments";
import { usePayouts } from "./usePayouts";
import { usePros } from "./usePros";
import { BookingStatus, PaymentStatus, Category } from "@repo/domain";

export function useDashboard() {
  // Fetch all data (we'll aggregate on the frontend for Phase 1)
  // Note: API limits bookings/payments/pros to 100, payouts allows up to 1000
  const { data: bookings, isLoading: bookingsLoading } = useBookings({ limit: 100 });
  const { data: payments, isLoading: paymentsLoading } = usePayments({ limit: 100 });
  const { data: payouts, isLoading: payoutsLoading } = usePayouts(1000);
  const { data: pros, isLoading: prosLoading } = usePros({ limit: 100 });

  const isLoading = bookingsLoading || paymentsLoading || payoutsLoading || prosLoading;

  // Calculate stats
  const stats = useMemo(() => {
    if (!bookings || !payments || !payouts || !pros) {
      return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Bookings stats
    const bookingsToday = bookings.filter(
      (b) => new Date(b.createdAt) >= today
    ).length;
    const bookingsThisWeek = bookings.filter(
      (b) => new Date(b.createdAt) >= weekAgo
    ).length;
    const bookingsThisMonth = bookings.filter(
      (b) => new Date(b.createdAt) >= monthAgo
    ).length;

    // Revenue stats (from captured payments)
    const capturedPayments = payments.filter((p) => p.status === PaymentStatus.CAPTURED);
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
    const pendingPayoutsAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

    // Active pros
    const activePros = pros.filter((p) => p.status === "active").length;

    // Booking status breakdown
    const bookingStatusBreakdown = {
      pending_payment: bookings.filter((b) => b.status === BookingStatus.PENDING_PAYMENT).length,
      pending: bookings.filter((b) => b.status === BookingStatus.PENDING).length,
      accepted: bookings.filter((b) => b.status === BookingStatus.ACCEPTED).length,
      on_my_way: bookings.filter((b) => b.status === BookingStatus.ON_MY_WAY).length,
      arrived: bookings.filter((b) => b.status === BookingStatus.ARRIVED).length,
      completed: bookings.filter((b) => b.status === BookingStatus.COMPLETED).length,
      rejected: bookings.filter((b) => b.status === BookingStatus.REJECTED).length,
      cancelled: bookings.filter((b) => b.status === BookingStatus.CANCELLED).length,
    };

    // Recent activity (last 10 items)
    const recentBookings = [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const recentPayments = [...payments]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    const recentPayouts = [...payouts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
        date: date.toLocaleDateString("es-UY", { month: "short", day: "numeric" }),
        revenue: dayRevenue,
      });
    }

    // Payment status breakdown
    const paymentStatusBreakdown = {
      CREATED: payments.filter((p) => p.status === PaymentStatus.CREATED).length,
      REQUIRES_ACTION: payments.filter((p) => p.status === PaymentStatus.REQUIRES_ACTION).length,
      AUTHORIZED: payments.filter((p) => p.status === PaymentStatus.AUTHORIZED).length,
      CAPTURED: payments.filter((p) => p.status === PaymentStatus.CAPTURED).length,
      FAILED: payments.filter((p) => p.status === PaymentStatus.FAILED).length,
      CANCELLED: payments.filter((p) => p.status === PaymentStatus.CANCELLED).length,
      REFUNDED: payments.filter((p) => p.status === PaymentStatus.REFUNDED).length,
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

    // Category performance (note: category not available in adminList response, placeholder for future)
    // Will need to update API to include category in adminList response
    const categoryPerformance: Array<{ category: Category; bookings: number; revenue: number }> = [];

    return {
      bookings: {
        today: bookingsToday,
        thisWeek: bookingsThisWeek,
        thisMonth: bookingsThisMonth,
        total: bookings.length,
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
      bookingStatusBreakdown,
      revenueTrends,
      paymentStatusBreakdown,
      paymentStatusAmounts,
      payoutStatusBreakdown,
      payoutStatusAmounts,
      categoryPerformance,
      recentBookings,
      recentPayments,
      recentPayouts,
    };
  }, [bookings, payments, payouts, pros]);

  return {
    stats,
    isLoading,
  };
}
