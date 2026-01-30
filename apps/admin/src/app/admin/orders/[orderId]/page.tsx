"use client";

import { use } from "react";
import { OrderDetailScreen } from "@/screens/orders/OrderDetailScreen";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { orderId } = use(params);
  return <OrderDetailScreen orderId={orderId} />;
}
