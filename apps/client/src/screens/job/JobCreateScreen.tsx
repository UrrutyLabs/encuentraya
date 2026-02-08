"use client";

import {
  useState,
  useMemo,
  useRef,
  useEffect,
  startTransition,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { AppShell } from "@/components/presentational/AppShell";
import { WhatsAppPromptCard } from "@/components/presentational/WhatsAppPromptCard";
import { JobForm } from "@/components/forms/JobForm";
import { JobCreateSkeleton } from "@/components/presentational/JobCreateSkeleton";
import { useProDetail } from "@/hooks/pro";
import { useCreateOrder } from "@/hooks/order";
import { useClientProfile } from "@/hooks/client";
import { useRebookTemplate } from "@/hooks/order";
import { useTodayDate } from "@/hooks/shared";
import { useAvailableOrderTimes } from "@/hooks/order";
import { useCategories } from "@/hooks/category";
import { JOB_LABELS } from "@/utils/jobLabels";
import { logger } from "@/lib/logger";

function JobCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proId = searchParams.get("proId");
  const rebookFrom = searchParams.get("rebookFrom");

  // Fetch rebook template if rebookFrom is present
  const {
    data: rebookTemplate,
    isLoading: isLoadingRebook,
    error: rebookError,
  } = useRebookTemplate(rebookFrom || undefined);

  // Fetch categories for the form
  const { categories } = useCategories();

  // Derive initial values from rebook template (memoized to prevent recalculation)
  const rebookValues = useMemo(() => {
    if (rebookTemplate) {
      return {
        categoryId: rebookTemplate.categoryId,
        address: rebookTemplate.addressText,
        hours: (rebookTemplate.estimatedHours ?? 0).toString(),
      };
    }
    return null;
  }, [rebookTemplate]);

  // Initialize state with values from rebook template if available
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState(rebookValues?.address || "");
  const [hours, setHours] = useState(rebookValues?.hours || "");
  const [categoryId, setCategoryId] = useState<string | "">(
    rebookValues?.categoryId || ""
  );

  // Track previous rebookValues to update state only when template first loads
  const prevRebookValuesRef = useRef(rebookValues);

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = useTodayDate();

  // Determine proId: from rebook template or query param
  const effectiveProId = rebookTemplate?.proProfileId || proId;

  // Fetch pro details to get hourly rate and availability slots
  const { pro, isLoading: isLoadingPro } = useProDetail(
    effectiveProId || undefined
  );

  // Generate available order times with validation
  const { availableTimes, handleDateChange: handleDateChangeWithValidation } =
    useAvailableOrderTimes(date, today, time, setTime, {
      minBufferMinutes: 60, // 1 hour minimum buffer
      startHour: 9,
      endHour: 18,
      availabilitySlots: pro?.availabilitySlots, // Filter times by pro's availability
    });

  // Wrap handleDateChange to also update the date state
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    handleDateChangeWithValidation(newDate);
  };

  // Order creation hook
  const { createOrder, isPending, error: createError } = useCreateOrder();

  // Fetch client profile for WhatsApp prompt
  const { profile } = useClientProfile();

  // Update form fields when rebook template first becomes available
  // Using startTransition to mark updates as non-urgent, avoiding cascading renders
  useEffect(() => {
    const prevValues = prevRebookValuesRef.current;
    if (rebookValues && prevValues !== rebookValues) {
      prevRebookValuesRef.current = rebookValues;
      // Use startTransition to defer state updates, preventing cascading renders
      startTransition(() => {
        if (categoryId !== rebookValues.categoryId) {
          setCategoryId(rebookValues.categoryId);
        }
        if (address !== rebookValues.address) {
          setAddress(rebookValues.address);
        }
        if (hours !== rebookValues.hours) {
          setHours(rebookValues.hours);
        }
      });
    }
  }, [rebookValues, categoryId, address, hours]);

  // Calculate estimated cost
  const estimatedCost =
    pro && hours ? parseFloat(hours) * pro.hourlyRate : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !effectiveProId ||
      !categoryId ||
      !date ||
      !time ||
      !address ||
      !hours
    ) {
      return;
    }

    // Combine date and time into scheduledAt
    const scheduledAt = new Date(`${date}T${time}`);

    try {
      await createOrder({
        proProfileId: effectiveProId,
        categoryId: categoryId,
        description: `Servicio en ${address}`,
        addressText: address,
        scheduledWindowStartAt: scheduledAt,
        estimatedHours: parseFloat(hours),
      });
      // Success - hook's onSuccess will handle redirect
    } catch (error) {
      // Error is handled by hook state, just log it
      logger.error(
        "Error creating order",
        error instanceof Error ? error : new Error(String(error)),
        {
          proProfileId: effectiveProId,
          categoryId,
        }
      );
    }
  };

  // Handle rebook error
  if (rebookFrom && rebookError) {
    return (
      <AppShell showLogin={false}>
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="h2" className="mb-2 text-text">
                No se puede volver a contratar desde este trabajo
              </Text>
              <Text variant="body" className="text-muted mb-4">
                El trabajo seleccionado no está disponible para volver a
                contratar.
              </Text>
              <div className="flex gap-2 justify-center">
                <Link href="/">
                  <Button variant="primary">Buscar profesionales</Button>
                </Link>
                <Link href="/my-jobs">
                  <Button variant="ghost">{JOB_LABELS.myJobs}</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!effectiveProId) {
    return (
      <AppShell showLogin={false}>
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="h2" className="mb-2 text-text">
                Profesional no especificado
              </Text>
              <Text variant="body" className="text-muted mb-4">
                Por favor, seleccioná un profesional desde la búsqueda.
              </Text>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
              >
                Ir a búsqueda
              </button>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isLoadingRebook || isLoadingPro) {
    return (
      <AppShell showLogin={false}>
        <div className="px-4 py-8">
          <JobCreateSkeleton />
        </div>
      </AppShell>
    );
  }

  if (!pro) {
    return (
      <AppShell showLogin={false}>
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="h2" className="mb-2 text-text">
                Profesional no encontrado
              </Text>
              <Text variant="body" className="text-muted mb-4">
                El profesional seleccionado no existe o fue eliminado.
              </Text>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
              >
                Volver a búsqueda
              </button>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  // Check if should show WhatsApp prompt
  const shouldShowPrompt =
    profile && !profile.phone && profile.preferredContactMethod === "WHATSAPP";

  // Check if pro is suspended when rebooking
  const isRebookingSuspended =
    rebookFrom && pro && (pro.isSuspended || !pro.isApproved);

  return (
    <AppShell showLogin={false}>
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Text variant="h1" className="mb-2 text-primary">
            {JOB_LABELS.createJob}
          </Text>
          <Text variant="body" className="text-muted mb-6">
            Con {pro.name} - ${pro.hourlyRate.toFixed(0)}/hora
          </Text>

          {/* WhatsApp prompt */}
          {shouldShowPrompt && <WhatsAppPromptCard />}

          {/* Suspended pro message (rebook) */}
          {isRebookingSuspended ? (
            <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-danger/10 border-danger/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Text variant="h2" className="text-danger mb-2">
                    Profesional suspendido
                  </Text>
                  <Text variant="body" className="text-text">
                    Este profesional está suspendido y no está disponible para
                    nuevos trabajos en este momento.
                  </Text>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link href="/">
                  <Button variant="primary">Buscar otros profesionales</Button>
                </Link>
                <Link href="/my-jobs">
                  <Button variant="ghost">{JOB_LABELS.backToJobs}</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <>
              {/* Rebook info banner */}
              {rebookFrom && rebookTemplate && (
                <Card className="p-4 mb-4 md:mb-6 bg-primary/5 border-primary/20">
                  <Text variant="body" className="text-text">
                    Esta es una nueva solicitud. El profesional debe aceptarla.
                  </Text>
                </Card>
              )}

              <Card className="p-4 md:p-6">
                <JobForm
                  date={date}
                  time={time}
                  address={address}
                  hours={hours}
                  categoryId={categoryId}
                  onDateChange={handleDateChange}
                  onTimeChange={setTime}
                  onAddressChange={setAddress}
                  onHoursChange={setHours}
                  onCategoryChange={setCategoryId}
                  onSubmit={handleSubmit}
                  loading={isPending}
                  error={createError?.message}
                  estimatedCost={estimatedCost}
                  availableCategories={categories.filter((cat) =>
                    pro.categoryIds.includes(cat.id)
                  )}
                  minDate={today}
                  availableTimes={availableTimes}
                />
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export function JobCreateScreen() {
  return (
    <Suspense
      fallback={
        <AppShell showLogin={false}>
          <div className="px-4 py-8">
            <JobCreateSkeleton />
          </div>
        </AppShell>
      }
    >
      <JobCreateContent />
    </Suspense>
  );
}
