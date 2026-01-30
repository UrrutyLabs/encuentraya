"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  User,
  Filter,
  Calendar,
  MapPin,
  Hourglass,
  FileText,
  X,
  Star,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { JobDetailSkeleton } from "@/components/presentational/JobDetailSkeleton";
import {
  OrderStatus,
  formatCurrency,
  toMajorUnits,
  type Order,
} from "@repo/domain";
import { useOrderDetail } from "@/hooks/order";
import { useCancelOrder } from "@/hooks/order";
import { useCategory } from "@/hooks/category";
import { getJobStatusLabel, getJobStatusVariant } from "@/utils/jobStatus";
import { JOB_LABELS } from "@/utils/jobLabels";
import { logger } from "@/lib/logger";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function JobDetailScreen() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.jobId as string; // Extract jobId from route, use as orderId for API calls

  // Fetch order and related data via hook
  const { order, pro, existingReview, payment, isLoading, error } =
    useOrderDetail(orderId);

  // Cancel order hook
  const { cancelOrder, isPending: isCancelling } = useCancelOrder(orderId);

  // Fetch category for display
  const { category } = useCategory(order?.categoryId);

  // Use job variable for display (type is Order)
  const job: Order | undefined = order ?? undefined;

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
        // Success - hook's onSuccess will handle redirect
      } catch (error) {
        // Error is handled by hook state, just log it
        logger.error(
          "Error cancelling order",
          error instanceof Error ? error : new Error(String(error)),
          {
            orderId: job.id,
          }
        );
      }
    }
  };

  const handleAuthorizePayment = () => {
    router.push(`/checkout?orderId=${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-4 md:py-8">
          <JobDetailSkeleton />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-8 text-center">
              <Text variant="h2" className="mb-2 text-text">
                Trabajo no encontrado
              </Text>
              <Text variant="body" className="text-muted mb-4">
                El trabajo que buscas no existe o fue eliminado.
              </Text>
              <Link href="/my-jobs">
                <Button variant="primary">{JOB_LABELS.backToJobs}</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel = getJobStatusLabel(job.status);
  const statusVariant = getJobStatusVariant(job.status);
  const categoryLabel = category?.name || "Cargando...";

  // Check if pro is active (approved and not suspended)
  const isProActive = pro ? pro.isApproved && !pro.isSuspended : false;
  const isProSuspended = pro?.isSuspended ?? false;

  // Extract address from order
  const address = job.addressText || job.description || "";

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <Link href="/my-jobs">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            </Link>
            <Badge variant={statusVariant} showIcon>
              {statusLabel}
            </Badge>
          </div>

          <Text variant="h1" className="mb-4 md:mb-6 text-primary">
            {JOB_LABELS.jobDetails}
          </Text>

          {/* Pro Summary */}
          {/* Waiting for pro confirmation */}
          {job.status === OrderStatus.PENDING_PRO_CONFIRMATION && (
            <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-info/10 border-info/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-info" />
                    <Text variant="h2" className="text-text">
                      Esperando confirmación del profesional
                    </Text>
                  </div>
                  <Text variant="body" className="text-muted mb-2">
                    El profesional está revisando tu solicitud. Te notificaremos
                    cuando acepte el trabajo.
                  </Text>
                </div>
                <Badge variant="info" showIcon>
                  Pendiente
                </Badge>
              </div>
            </Card>
          )}

          {/* Payment Banner - Show when payment authorization is needed (order is ACCEPTED) */}
          {job.status === OrderStatus.ACCEPTED && (
            <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-warning/10 border-warning/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    <Text variant="h2" className="text-text">
                      Pago pendiente
                    </Text>
                  </div>
                  <Text variant="body" className="text-muted mb-2">
                    El profesional aceptó tu solicitud. Para continuar,
                    necesitás autorizar el pago.
                  </Text>
                  {payment && (
                    <div className="mt-2">
                      <Text variant="body" className="text-text font-medium">
                        Monto estimado:{" "}
                        {formatCurrency(
                          payment.amountEstimated,
                          payment.currency,
                          true
                        )}
                      </Text>
                    </div>
                  )}
                </div>
                <Badge variant="warning" showIcon>
                  Pago pendiente
                </Badge>
              </div>
              <Button
                variant="primary"
                onClick={handleAuthorizePayment}
                className="w-full md:w-auto flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {JOB_LABELS.payJob}
              </Button>
            </Card>
          )}

          {pro && (
            <Card className="p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <Text variant="h2" className="text-text">
                  Profesional
                </Text>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Text variant="body" className="text-text font-medium mb-1">
                    {pro.name}
                  </Text>
                  <Text variant="small" className="text-muted">
                    ${pro.hourlyRate.toFixed(0)}/hora
                  </Text>
                </div>
                <Link href={`/pros/${pro.id}`}>
                  <Button variant="ghost" className="flex items-center gap-2">
                    Ver perfil
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Job Summary */}
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
                  {job.estimatedHours}{" "}
                  {job.estimatedHours === 1 ? "hora" : "horas"}
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

          {/* Cost Summary */}
          <Card className="p-4 md:p-6 mb-4 md:mb-6">
            <div className="mb-4">
              <Text variant="h2" className="text-text">
                Resumen de costo
              </Text>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text variant="body" className="text-muted">
                  Tarifa por hora
                </Text>
                <Text variant="body" className="text-text">
                  ${toMajorUnits(job.hourlyRateSnapshotAmount).toFixed(0)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text variant="body" className="text-muted">
                  {JOB_LABELS.estimatedHours}
                </Text>
                <Text variant="body" className="text-text">
                  {job.estimatedHours}
                </Text>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <Text variant="body" className="text-text font-medium">
                    Total estimado
                  </Text>
                  <Text variant="h2" className="text-primary">
                    {job.totalAmount
                      ? `$${toMajorUnits(job.totalAmount).toFixed(0)}`
                      : `$${toMajorUnits(
                          job.hourlyRateSnapshotAmount * job.estimatedHours
                        ).toFixed(0)}`}
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          {canCancel && (
            <Card className="p-4 md:p-6">
              <Text variant="h2" className="mb-4 text-text">
                Acciones
              </Text>
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full md:w-auto flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {isCancelling ? "Cancelando..." : JOB_LABELS.cancelJob}
              </Button>
            </Card>
          )}

          {job.status === OrderStatus.COMPLETED && (
            <>
              {!existingReview && (
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
                    <Button
                      variant="primary"
                      className="flex items-center gap-2"
                    >
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
                        <Button
                          variant="primary"
                          className="flex items-center gap-2"
                        >
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
          )}

          {job.status === OrderStatus.CANCELED && (
            <Card className="p-4 md:p-6">
              <Text variant="body" className="text-muted">
                {JOB_LABELS.jobCanceled} el{" "}
                {job.canceledAt
                  ? formatDateShort(job.canceledAt)
                  : formatDateShort(job.updatedAt)}
                .
              </Text>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
