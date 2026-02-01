"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Calendar,
  MapPin,
  Hourglass,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { WhatsAppPromptCard } from "@/components/presentational/WhatsAppPromptCard";
import { CheckoutSkeleton } from "@/components/presentational/CheckoutSkeleton";
import { useClientProfile } from "@/hooks/client";
import {
  PaymentStatus,
  OrderStatus,
  formatCurrency,
  toMajorUnits,
  type Order,
} from "@repo/domain";
import { JOB_LABELS } from "@/utils/jobLabels";
import Link from "next/link";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  const { data: order, isLoading: isLoadingOrder } =
    trpc.order.getById.useQuery(
      { id: orderId! },
      {
        enabled: !!orderId,
        retry: false,
      }
    );

  // Fetch payment summary
  const { data: payment, isLoading: isLoadingPayment } =
    trpc.payment.getByOrder.useQuery(
      { orderId: orderId! },
      {
        enabled: !!orderId,
        retry: false,
      }
    );

  // Fetch client profile for WhatsApp prompt
  const { profile } = useClientProfile();

  // Create preauth mutation
  const createPreauth = trpc.payment.createPreauthForOrder.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirect to provider checkout URL
        window.location.assign(data.checkoutUrl);
      } else {
        setError("No se pudo obtener la URL de pago. Probá de nuevo.");
      }
    },
    onError: () => {
      setError("No pudimos iniciar el pago. Probá de nuevo.");
    },
  });

  const handleAuthorizePayment = async () => {
    if (!orderId) return;
    setError(null);
    try {
      await createPreauth.mutateAsync({ orderId });
    } catch {
      // Error handled by mutation onError
    }
  };

  // Missing orderId
  if (!orderId) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-8 text-center">
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <Text variant="h2" className="mb-2 text-text">
                Falta el identificador del trabajo.
              </Text>
              <Link href="/my-jobs">
                <Button
                  variant="secondary"
                  className="mt-4 flex items-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {JOB_LABELS.backToJobs}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  const isLoading = isLoadingOrder || isLoadingPayment;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-4 md:py-8">
          <CheckoutSkeleton />
        </div>
      </div>
    );
  }

  // Check if payment is already authorized
  const isAuthorized =
    payment &&
    (payment.status === PaymentStatus.AUTHORIZED ||
      payment.status === PaymentStatus.CAPTURED);

  if (isAuthorized) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-success" />
                <Text variant="h1" className="text-primary">
                  Autorizar pago
                </Text>
              </div>
              <Text variant="body" className="mb-6 text-text">
                El pago ya está autorizado.
              </Text>
              <Link href={`/my-jobs/${orderId}`}>
                <Button variant="primary">{JOB_LABELS.viewJob}</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Validate order status - payment can only be authorized when order is ACCEPTED
  if (order && order.status !== OrderStatus.ACCEPTED) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-6 h-6 text-warning" />
                <Text variant="h1" className="text-primary">
                  Autorizar pago
                </Text>
              </div>
              {order.status === OrderStatus.PENDING_PRO_CONFIRMATION ? (
                <>
                  <Text variant="body" className="mb-2 text-text">
                    El profesional aún no ha aceptado tu solicitud.
                  </Text>
                  <Text variant="body" className="mb-6 text-muted">
                    Podrás autorizar el pago una vez que el profesional acepte
                    el trabajo.
                  </Text>
                </>
              ) : (
                <>
                  <Text variant="body" className="mb-6 text-text">
                    El estado de este trabajo no permite autorizar el pago en
                    este momento.
                  </Text>
                </>
              )}
              <Link href={`/my-jobs/${orderId}`}>
                <Button variant="primary" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al trabajo
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Format date and time
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-UY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Use job variable for display (type is Order)
  const job: Order | undefined = order ?? undefined;
  const isFixedOrder = job?.pricingMode === "fixed";

  // Calculate amount: payment first; for fixed without payment use quotedAmountCents
  const amountEstimatedMinor =
    payment?.amountEstimated ??
    (isFixedOrder && job?.quotedAmountCents ? job.quotedAmountCents : null) ??
    job?.totalAmount ??
    0;
  const amountEstimated = toMajorUnits(amountEstimatedMinor);
  const currency = payment?.currency || job?.currency || "UYU";

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Text variant="h1" className="mb-6 text-primary">
            Autorizar pago
          </Text>

          {/* Job Summary */}
          {job && (
            <Card className="p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <Text variant="h2" className="text-text">
                  Resumen del trabajo
                </Text>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-muted" />
                    <Text variant="small" className="text-muted">
                      Fecha y hora:
                    </Text>
                  </div>
                  <Text variant="body" className="text-text">
                    {formatDate(job.scheduledWindowStartAt)} a las{" "}
                    {formatTime(job.scheduledWindowStartAt)}
                  </Text>
                </div>
                {job.addressText && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted" />
                      <Text variant="small" className="text-muted">
                        {JOB_LABELS.address}:
                      </Text>
                    </div>
                    <Text variant="body" className="text-text">
                      {job.addressText}
                    </Text>
                  </div>
                )}
                {isFixedOrder ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Hourglass className="w-4 h-4 text-muted" />
                      <Text variant="small" className="text-muted">
                        Presupuesto acordado
                      </Text>
                    </div>
                  </div>
                ) : (
                  job.estimatedHours != null &&
                  job.estimatedHours > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Hourglass className="w-4 h-4 text-muted" />
                        <Text variant="small" className="text-muted">
                          {JOB_LABELS.estimatedHours}:
                        </Text>
                      </div>
                      <Text variant="body" className="text-text">
                        {job.estimatedHours}{" "}
                        {job.estimatedHours === 1 ? "hora" : "horas"}
                      </Text>
                    </div>
                  )
                )}
              </div>
            </Card>
          )}

          {/* Amount Summary */}
          <Card className="p-6 mb-6">
            <div className="mb-4">
              <Text variant="h2" className="text-text">
                Monto estimado: {formatCurrency(amountEstimated, currency)}
              </Text>
            </div>
            <Text variant="small" className="text-muted">
              Este es un monto estimado. El cobro final depende del trabajo
              realizado. Nunca se cobrará más sin aviso.
            </Text>
          </Card>

          {/* WhatsApp prompt - show if no phone and wants WhatsApp */}
          {profile &&
            !profile.phone &&
            profile.preferredContactMethod === "WHATSAPP" && (
              <WhatsAppPromptCard />
            )}

          {/* Error message */}
          {error && (
            <Card className="p-4 mb-6 bg-danger/10 border-danger/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger" />
                <Text variant="body" className="text-danger">
                  {error}
                </Text>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={handleAuthorizePayment}
              disabled={createPreauth.isPending || !orderId}
              className="flex items-center gap-2"
            >
              {createPreauth.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Autorizar pago
                </>
              )}
            </Button>
            <Link href="/my-jobs">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                {JOB_LABELS.backToJobs}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutScreen() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg">
          <Navigation showLogin={false} showProfile={true} />
          <div className="px-4 py-4 md:py-8">
            <CheckoutSkeleton />
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
