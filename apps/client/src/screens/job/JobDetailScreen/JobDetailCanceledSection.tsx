"use client";

import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { JOB_LABELS } from "@/utils/jobLabels";
import { formatDateShort } from "@/utils/date";
import type { Order } from "@repo/domain";

interface JobDetailCanceledSectionProps {
  job: Order;
}

export function JobDetailCanceledSection({
  job,
}: JobDetailCanceledSectionProps) {
  return (
    <Card className="p-4 md:p-6">
      <Text variant="body" className="text-muted">
        {JOB_LABELS.jobCanceled} el{" "}
        {job.canceledAt
          ? formatDateShort(job.canceledAt)
          : formatDateShort(job.updatedAt)}
        .
      </Text>
    </Card>
  );
}
