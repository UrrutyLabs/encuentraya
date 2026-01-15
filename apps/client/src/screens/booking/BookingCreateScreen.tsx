"use client";

import { useState, useMemo, useRef, useEffect, startTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { WhatsAppPromptCard } from "@/components/presentational/WhatsAppPromptCard";
import { BookingForm } from "@/components/forms/BookingForm";
import { useProDetail } from "@/hooks/useProDetail";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useRebookTemplate } from "@/hooks/useRebookTemplate";
import { Category } from "@repo/domain";
import { logger } from "@/lib/logger";

function BookingCreateContent() {
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

  // Derive initial values from rebook template (memoized to prevent recalculation)
  const rebookValues = useMemo(() => {
    if (rebookTemplate) {
      return {
        category: rebookTemplate.category,
        address: rebookTemplate.addressText,
        hours: rebookTemplate.estimatedHours.toString(),
      };
    }
    return null;
  }, [rebookTemplate]);

  // Initialize state with values from rebook template if available
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState(rebookValues?.address || "");
  const [hours, setHours] = useState(rebookValues?.hours || "");
  const [category, setCategory] = useState<Category | "">(rebookValues?.category || "");
  
  // Track previous rebookValues to update state only when template first loads
  const prevRebookValuesRef = useRef(rebookValues);

  // Determine proId: from rebook template or query param
  const effectiveProId = rebookTemplate?.proProfileId || proId;

  // Fetch pro details to get hourly rate
  const { pro, isLoading: isLoadingPro } = useProDetail(effectiveProId || undefined);

  // Booking creation hook
  const { createBooking, isPending, error: createError } = useCreateBooking();

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
        if (category !== rebookValues.category) {
          setCategory(rebookValues.category);
        }
        if (address !== rebookValues.address) {
          setAddress(rebookValues.address);
        }
        if (hours !== rebookValues.hours) {
          setHours(rebookValues.hours);
        }
      });
    }
  }, [rebookValues, category, address, hours]);

  // Calculate estimated cost
  const estimatedCost =
    pro && hours ? parseFloat(hours) * pro.hourlyRate : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveProId || !category || !date || !time || !address || !hours) {
      return;
    }

    // Combine date and time into scheduledAt
    const scheduledAt = new Date(`${date}T${time}`);

    try {
      await createBooking({
        proId: effectiveProId,
        category: category as Category,
        description: `Servicio en ${address}`,
        scheduledAt,
        estimatedHours: parseFloat(hours),
      });
      // Success - hook's onSuccess will handle redirect
    } catch (error) {
      // Error is handled by hook state, just log it
      logger.error("Error creating booking", error instanceof Error ? error : new Error(String(error)), {
        proId: effectiveProId,
        category,
      });
    }
  };

  // Handle rebook error
  if (rebookFrom && rebookError) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="h2" className="mb-2 text-text">
                No se puede volver a contratar desde esta reserva
              </Text>
              <Text variant="body" className="text-muted mb-4">
                La reserva seleccionada no está disponible para volver a contratar.
              </Text>
              <div className="flex gap-2 justify-center">
                <Link href="/search">
                  <Button variant="primary">Buscar profesionales</Button>
                </Link>
                <Link href="/my-bookings">
                  <Button variant="ghost">Mis reservas</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!effectiveProId) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
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
                onClick={() => router.push("/search")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
              >
                Ir a búsqueda
              </button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingRebook || isLoadingPro) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="body" className="text-muted">
                Cargando información...
              </Text>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
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
                onClick={() => router.push("/search")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
              >
                Volver a búsqueda
              </button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Check if should show WhatsApp prompt
  const shouldShowPrompt =
    profile &&
    !profile.phone &&
    profile.preferredContactMethod === "WHATSAPP";

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Text variant="h1" className="mb-2 text-primary">
            Reservar servicio
          </Text>
          <Text variant="body" className="text-muted mb-6">
            Con {pro.name} - ${pro.hourlyRate.toFixed(0)}/hora
          </Text>

          {/* WhatsApp prompt */}
          {shouldShowPrompt && <WhatsAppPromptCard />}

          {/* Rebook info banner */}
          {rebookFrom && rebookTemplate && (
            <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
              <Text variant="body" className="text-text">
                Esta es una nueva solicitud. El profesional debe aceptarla.
              </Text>
            </Card>
          )}

          <Card className="p-6">
            <BookingForm
              date={date}
              time={time}
              address={address}
              hours={hours}
              category={category}
              onDateChange={setDate}
              onTimeChange={setTime}
              onAddressChange={setAddress}
              onHoursChange={setHours}
              onCategoryChange={setCategory}
              onSubmit={handleSubmit}
              loading={isPending}
              error={createError?.message}
              estimatedCost={estimatedCost}
              availableCategories={pro.categories}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export function BookingCreateScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    }>
      <BookingCreateContent />
    </Suspense>
  );
}
