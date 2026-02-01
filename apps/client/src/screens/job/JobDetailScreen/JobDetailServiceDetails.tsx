"use client";

import { Filter, Calendar, MapPin, Hourglass, FileText } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { JOB_LABELS } from "@/utils/jobLabels";
import { formatDate } from "@/utils/date";
import type { Order } from "@repo/domain";

interface JobDetailServiceDetailsProps {
  job: Order;
  categoryLabel: string;
}

export function JobDetailServiceDetails({
  job,
  categoryLabel,
}: JobDetailServiceDetailsProps) {
  const address = job.addressText || job.description || "";

  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <Text variant="h2" className="text-text">
          Detalles del servicio
        </Text>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Filter className="w-4 h-4 text-muted" />
            <Text variant="small" className="text-muted">
              {JOB_LABELS.category}
            </Text>
          </div>
          <Text variant="body" className="text-text">
            {categoryLabel}
          </Text>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-muted" />
            <Text variant="small" className="text-muted">
              {JOB_LABELS.scheduledAt}
            </Text>
          </div>
          <Text variant="body" className="text-text">
            {formatDate(job.scheduledWindowStartAt)}
          </Text>
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-muted" />
            <Text variant="small" className="text-muted">
              {JOB_LABELS.address}
            </Text>
          </div>
          <Text variant="body" className="text-text">
            {address}
          </Text>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Hourglass className="w-4 h-4 text-muted" />
            <Text variant="small" className="text-muted">
              {JOB_LABELS.estimatedHours}
            </Text>
          </div>
          <Text variant="body" className="text-text">
            {job.estimatedHours} {job.estimatedHours === 1 ? "hora" : "horas"}
          </Text>
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-muted" />
            <Text variant="small" className="text-muted">
              {JOB_LABELS.description}
            </Text>
          </div>
          <Text variant="body" className="text-text">
            {job.description || job.title || "Sin descripción"}
          </Text>
        </div>
      </div>
    </Card>
  );
}
