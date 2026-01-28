"use client";

import { memo, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, CreditCard, RotateCcw, Star, ArrowRight } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import type { Order } from "@repo/domain";
import { OrderStatus } from "@repo/domain";
import { getJobStatusLabel, getJobStatusVariant } from "@/utils/jobStatus";
import { JOB_LABELS } from "@/utils/jobLabels";

interface JobCardProps {
  job: Order;
  hasReview?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plomería",
  electrical: "Electricidad",
  cleaning: "Limpieza",
  handyman: "Arreglos generales",
  painting: "Pintura",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const JobCard = memo(
  function JobCard({ job, hasReview = false }: JobCardProps) {
    const router = useRouter();

    // Memoize computed values
    const statusLabel = useMemo(
      () => getJobStatusLabel(job.status),
      [job.status]
    );
    const statusVariant = useMemo(
      () => getJobStatusVariant(job.status),
      [job.status]
    );
    const categoryLabel = useMemo(
      () => CATEGORY_LABELS[job.category] || job.category,
      [job.category]
    );
    const formattedDate = useMemo(
      () => formatDate(job.scheduledWindowStartAt),
      [job.scheduledWindowStartAt]
    );

    const showReviewPrompt = useMemo(
      () => job.status === OrderStatus.COMPLETED && !hasReview,
      [job.status, hasReview]
    );
    const showPaymentPrompt = useMemo(
      () =>
        job.status === OrderStatus.PENDING_PRO_CONFIRMATION ||
        job.status === OrderStatus.CONFIRMED,
      [job.status]
    );
    const showRebookPrompt = useMemo(
      () => job.status === OrderStatus.COMPLETED && job.proProfileId,
      [job.status, job.proProfileId]
    );

    // Memoize event handlers
    const handleCardClick = useCallback(() => {
      router.push(`/my-jobs/${job.id}`);
    }, [router, job.id]);

    const handlePayNow = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/checkout?orderId=${job.id}`);
      },
      [router, job.id]
    );

    const handleRebook = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/book?rebookFrom=${job.id}`);
      },
      [router, job.id]
    );

    // Calculate display amount
    const displayAmount = job.totalAmount
      ? job.totalAmount
      : job.hourlyRateSnapshotAmount * job.estimatedHours;

    return (
      <Card
        className="hover:shadow-md active:shadow-lg transition-shadow cursor-pointer touch-manipulation"
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <Text variant="h2" className="text-text">
              {categoryLabel}
            </Text>
            {job.displayId && (
              <Text variant="small" className="text-muted">
                {JOB_LABELS.jobNumber} {job.displayId}
              </Text>
            )}
          </div>
          <Badge variant={statusVariant} showIcon>
            {statusLabel}
          </Badge>
        </div>
        <Text variant="body" className="text-muted mb-2 line-clamp-2">
          {job.description || job.title || "Sin descripción"}
        </Text>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted" />
          <Text variant="small" className="text-muted">
            {formattedDate}
          </Text>
        </div>
        <div className="flex justify-between items-center">
          <Text variant="small" className="text-text font-medium">
            ${displayAmount.toFixed(0)}
          </Text>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {showPaymentPrompt && (
              <button
                onClick={handlePayNow}
                className="min-h-[44px] md:min-h-0 flex items-center gap-1 px-4 py-2 md:px-3 md:py-1 bg-primary text-white text-sm font-medium rounded-lg md:rounded-md hover:opacity-90 active:opacity-75 transition-opacity touch-manipulation"
              >
                <CreditCard className="w-4 h-4" />
                {JOB_LABELS.payJob}
              </button>
            )}
            {/* Prioritize review action when pending */}
            {showReviewPrompt ? (
              <>
                <Link
                  href={`/my-jobs/${job.id}/review`}
                  onClick={(e) => e.stopPropagation()}
                  className="min-h-[44px] md:min-h-0 flex items-center gap-1 px-4 py-2 md:px-3 md:py-1 bg-primary text-white text-sm font-medium rounded-lg md:rounded-md hover:opacity-90 active:opacity-75 transition-opacity touch-manipulation"
                >
                  <Star className="w-4 h-4" />
                  {JOB_LABELS.reviewJob}
                </Link>
                {showRebookPrompt && (
                  <button
                    onClick={handleRebook}
                    className="min-h-[44px] md:min-h-0 flex items-center gap-1 px-4 py-2 md:px-3 md:py-1 text-primary hover:underline text-sm font-medium touch-manipulation"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {JOB_LABELS.rebookJob}
                  </button>
                )}
              </>
            ) : (
              <>
                {showRebookPrompt && (
                  <button
                    onClick={handleRebook}
                    className="min-h-[44px] md:min-h-0 flex items-center gap-1 px-4 py-2 md:px-3 md:py-1 bg-primary text-white text-sm font-medium rounded-lg md:rounded-md hover:opacity-90 active:opacity-75 transition-opacity touch-manipulation"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {JOB_LABELS.rebookJob}
                  </button>
                )}
                {/* Only show "Ver detalles" when there are no action buttons */}
                {!showPaymentPrompt && !showRebookPrompt && (
                  <Text
                    variant="small"
                    className="text-muted flex items-center gap-1"
                  >
                    {JOB_LABELS.viewJob}
                    <ArrowRight className="w-3 h-3" />
                  </Text>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.job.id === nextProps.job.id &&
      prevProps.job.status === nextProps.job.status &&
      prevProps.hasReview === nextProps.hasReview
    );
  }
);
