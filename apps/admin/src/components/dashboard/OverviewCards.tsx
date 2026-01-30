"use client";

import { Calendar, DollarSign, Wallet, Users } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { formatCurrency } from "@repo/domain";
import { ORDER_LABELS } from "@/utils/orderLabels";

interface OverviewCardsProps {
  orders: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  payouts: {
    pending: number;
    pendingAmount: number;
    total: number;
  };
  pros: {
    active: number;
    total: number;
  };
  isLoading?: boolean;
}

export function OverviewCards({
  orders,
  revenue,
  payouts,
  pros,
  isLoading,
}: OverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted/30 rounded w-1/2 mb-2" />
            <div className="h-8 bg-muted/30 rounded w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Orders Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
        </div>
        <Text variant="h2" className="mb-1">
          {orders.total.toLocaleString()}
        </Text>
        <Text variant="small" className="text-muted mb-2">
          {ORDER_LABELS.totalOrders}
        </Text>
        <div className="flex gap-4 text-xs text-muted">
          <span>Hoy: {orders.today}</span>
          <span>Semana: {orders.thisWeek}</span>
          <span>Mes: {orders.thisMonth}</span>
        </div>
      </Card>

      {/* Revenue Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-success/10 rounded-lg">
            <DollarSign className="w-6 h-6 text-success" />
          </div>
        </div>
        <Text variant="h2" className="mb-1">
          {formatCurrency(revenue.thisMonth, "UYU", true)}
        </Text>
        <Text variant="small" className="text-muted mb-2">
          Ingresos este mes
        </Text>
        <div className="flex gap-4 text-xs text-muted">
          <span>Hoy: {formatCurrency(revenue.today, "UYU", true)}</span>
          <span>Semana: {formatCurrency(revenue.thisWeek, "UYU", true)}</span>
        </div>
      </Card>

      {/* Payouts Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-warning/10 rounded-lg">
            <Wallet className="w-6 h-6 text-warning" />
          </div>
        </div>
        <Text variant="h2" className="mb-1">
          {payouts.pending}
        </Text>
        <Text variant="small" className="text-muted mb-2">
          Cobros pendientes
        </Text>
        <div className="text-xs text-muted">
          <span>
            Monto: {formatCurrency(payouts.pendingAmount, "UYU", true)}
          </span>
        </div>
      </Card>

      {/* Pros Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-info/10 rounded-lg">
            <Users className="w-6 h-6 text-info" />
          </div>
        </div>
        <Text variant="h2" className="mb-1">
          {pros.active}
        </Text>
        <Text variant="small" className="text-muted mb-2">
          Profesionales activos
        </Text>
        <div className="text-xs text-muted">
          <span>Total: {pros.total}</span>
        </div>
      </Card>
    </div>
  );
}
