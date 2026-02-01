"use client";

import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { toMajorUnits } from "@repo/domain";
import { CostBreakdown } from "@/components/presentational/CostBreakdown";
import { orderToCostEstimation } from "./utils/orderToCostEstimation";
import type { OrderWithCostEstimate } from "@repo/domain";

interface JobDetailCostSummaryProps {
  job: OrderWithCostEstimate;
}

export function JobDetailCostSummary({ job }: JobDetailCostSummaryProps) {
  const estimation = job.costEstimate ?? orderToCostEstimation(job);

  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6">
      <div className="mb-4">
        <Text variant="h2" className="text-text">
          Resumen de costo
        </Text>
      </div>
      <CostBreakdown
        estimation={estimation}
        isLoading={false}
        error={null}
        fallbackLaborAmount={toMajorUnits(
          job.hourlyRateSnapshotAmount * job.estimatedHours
        )}
        fallbackHourlyRate={toMajorUnits(job.hourlyRateSnapshotAmount)}
        fallbackHours={String(job.estimatedHours)}
      />
    </Card>
  );
}
