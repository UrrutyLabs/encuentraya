"use client";

import { use } from "react";
import { PayoutDetailScreen } from "@/screens/admin/PayoutDetailScreen";

interface PageProps {
  params: Promise<{ payoutId: string }>;
}

export default function AdminPayoutDetailPage({ params }: PageProps) {
  const { payoutId } = use(params);
  return <PayoutDetailScreen payoutId={payoutId} />;
}
