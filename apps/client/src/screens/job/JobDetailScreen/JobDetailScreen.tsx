"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/presentational/AppShell";
import { JobDetailSkeleton } from "@/components/presentational/JobDetailSkeleton";
import { useSetMobileHeader } from "@/contexts/MobileHeaderContext";
import { OrderStatus, type OrderDetailView } from "@repo/domain";
import { useOrderDetail } from "@/hooks/order";
import { useCancelOrder } from "@/hooks/order";
import { useCategory } from "@/hooks/category";
import { getJobStatusLabel, getJobStatusVariant } from "@/utils/jobStatus";
import { logger } from "@/lib/logger";

import { JobDetailHeader } from "./JobDetailHeader";
import { JobDetailPendingPro } from "./JobDetailPendingPro";
import { JobDetailPaymentBanner } from "./JobDetailPaymentBanner";
import { JobDetailProCard } from "./JobDetailProCard";
import { JobDetailServiceDetails } from "./JobDetailServiceDetails";
import { JobDetailPhotos } from "./JobDetailPhotos";
import { JobDetailCostSummary } from "./JobDetailCostSummary";
import { JobDetailActions } from "./JobDetailActions";
import { JobDetailCompletedSection } from "./JobDetailCompletedSection";
import { JobDetailCanceledSection } from "./JobDetailCanceledSection";
import { JobDetailNotFound } from "./JobDetailNotFound";

export function JobDetailScreen() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.jobId as string;

  const { order, pro, existingReview, payment, isLoading, error } =
    useOrderDetail(orderId);
  const { cancelOrder, isPending: isCancelling } = useCancelOrder(orderId);
  const { category } = useCategory(order?.categoryId);

  const job: OrderDetailView | undefined = order ?? undefined;
  const setHeader = useSetMobileHeader();

  useEffect(() => {
    if (job?.displayId) {
      setHeader?.setTitle(`Trabajo #${job.displayId}`);
      setHeader?.setBackHref("/my-jobs");
    }
    return () => {
      setHeader?.setTitle(null);
      setHeader?.setBackHref(null);
    };
  }, [job?.displayId, setHeader]);

  const canCancel =
    job &&
    (job.status === OrderStatus.PENDING_PRO_CONFIRMATION ||
      job.status === OrderStatus.ACCEPTED ||
      job.status === OrderStatus.CONFIRMED);

  const handleCancel = async () => {
    if (!job || !canCancel) return;
    if (confirm("¿Estás seguro de que querés cancelar este trabajo?")) {
      try {
        await cancelOrder(job.id);
      } catch (err) {
        logger.error(
          "Error cancelling order",
          err instanceof Error ? err : new Error(String(err)),
          { orderId: job.id }
        );
      }
    }
  };

  const handleAuthorizePayment = () => {
    router.push(`/checkout?orderId=${orderId}`);
  };

  if (isLoading) {
    return (
      <AppShell showLogin={false}>
        <div className="px-4 py-4 md:py-8">
          <JobDetailSkeleton />
        </div>
      </AppShell>
    );
  }

  if (error || !job) {
    return (
      <AppShell showLogin={false}>
        <div className="px-4 py-4 md:py-8">
          <JobDetailNotFound />
        </div>
      </AppShell>
    );
  }

  const statusLabel = getJobStatusLabel(job.status);
  const statusVariant = getJobStatusVariant(job.status);
  const categoryLabel = category?.name || "Cargando...";
  const isProActive = pro ? pro.isApproved && !pro.isSuspended : false;
  const isProSuspended = pro?.isSuspended ?? false;

  return (
    <AppShell showLogin={false}>
      <div className="px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          <JobDetailHeader
            statusLabel={statusLabel}
            statusVariant={statusVariant}
          />

          {job.status === OrderStatus.PENDING_PRO_CONFIRMATION && (
            <JobDetailPendingPro />
          )}

          {job.status === OrderStatus.ACCEPTED && (
            <JobDetailPaymentBanner
              payment={payment ?? undefined}
              onAuthorizePayment={handleAuthorizePayment}
            />
          )}

          {pro && (
            <JobDetailProCard
              pro={pro}
              orderId={orderId}
              showChatLink={!!(orderId && job.proProfileId)}
            />
          )}

          <JobDetailServiceDetails job={job} categoryLabel={categoryLabel} />
          <JobDetailPhotos job={job} />
          <JobDetailCostSummary job={job} />

          {canCancel && (
            <JobDetailActions
              onCancel={handleCancel}
              isCancelling={isCancelling}
            />
          )}

          {job.status === OrderStatus.COMPLETED && (
            <JobDetailCompletedSection
              job={job}
              orderId={orderId}
              hasExistingReview={!!existingReview}
              isProActive={isProActive}
              isProSuspended={isProSuspended}
            />
          )}

          {job.status === OrderStatus.CANCELED && (
            <JobDetailCanceledSection job={job} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
