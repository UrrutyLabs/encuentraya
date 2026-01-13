"use client";

import { use } from "react";
import { PaymentDetailScreen } from "@/screens/admin/PaymentDetailScreen";

interface PageProps {
  params: Promise<{ paymentId: string }>;
}

export default function AdminPaymentDetailPage({ params }: PageProps) {
  const { paymentId } = use(params);
  return <PaymentDetailScreen paymentId={paymentId} />;
}
