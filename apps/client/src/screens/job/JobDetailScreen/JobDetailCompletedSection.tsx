"use client";

import Link from "next/link";
import { Star, RotateCcw, CheckCircle } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { JOB_LABELS } from "@/utils/jobLabels";
import { formatDateShort } from "@/utils/date";
import type { Order } from "@repo/domain";

interface JobDetailCompletedSectionProps {
  job: Order;
  orderId: string;
  hasExistingReview: boolean;
  isProActive: boolean;
  isProSuspended: boolean;
}

export function JobDetailCompletedSection({
  job,
  orderId,
  hasExistingReview,
  isProActive,
  isProSuspended,
}: JobDetailCompletedSectionProps) {
  return (
    <>
      {!hasExistingReview && (
        <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-primary" />
            <Text variant="h2" className="text-text">
              ¿Cómo te fue con este trabajo?
            </Text>
          </div>
          <Text variant="body" className="text-muted mb-4">
            Compartí tu experiencia y ayudá a otros a encontrar el mejor
            profesional.
          </Text>
          <Link href={`/my-jobs/${orderId}/review`}>
            <Button variant="primary" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              {JOB_LABELS.reviewJob}
            </Button>
          </Link>
        </Card>
      )}
      {job.proProfileId && (
        <Card
          className={`p-6 mb-6 ${isProActive ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-muted/20"}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw
              className={`w-5 h-5 ${isProActive ? "text-primary" : "text-muted"}`}
            />
            <Text variant="h2" className="text-text">
              ¿Querés que vuelva este profesional?
            </Text>
          </div>
          {isProActive ? (
            <>
              <Text variant="body" className="text-muted mb-4">
                Creá una nueva solicitud para el mismo profesional.
              </Text>
              <Link href={`/book?rebookFrom=${orderId}`}>
                <Button variant="primary" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  {JOB_LABELS.rebookJob}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Text variant="body" className="text-muted mb-4">
                {isProSuspended
                  ? "Este profesional está suspendido y no está disponible para nuevos trabajos en este momento."
                  : "Este profesional no está disponible para nuevos trabajos en este momento."}
              </Text>
              <Button
                variant="primary"
                disabled
                className="flex items-center gap-2 opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {JOB_LABELS.rebookJob}
              </Button>
            </>
          )}
        </Card>
      )}
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          <Text variant="body" className="text-muted">
            {JOB_LABELS.jobCompleted} el{" "}
            {job.completedAt
              ? formatDateShort(job.completedAt)
              : formatDateShort(job.updatedAt)}
            .
          </Text>
        </div>
      </Card>
    </>
  );
}
