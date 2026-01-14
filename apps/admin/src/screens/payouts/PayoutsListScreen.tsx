"use client";

import { usePayouts } from "@/hooks/usePayouts";
import { PayoutsTable } from "@/components/payouts/PayoutsTable";
import { Text } from "@repo/ui";

export function PayoutsListScreen() {
  const { data: payouts, isLoading } = usePayouts(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Text variant="h1">Cobros</Text>
      </div>

      <PayoutsTable payouts={payouts || []} isLoading={isLoading} />
    </div>
  );
}
