"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Navigation } from "@/components/presentational/Navigation";
import { BookingForm } from "@/components/forms/BookingForm";
import { useProDetail } from "@/hooks/useProDetail";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { Category } from "@repo/domain";

export function BookingCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proId = searchParams.get("proId");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("");
  const [category, setCategory] = useState<Category | "">("");

  // Fetch pro details to get hourly rate
  const { pro, isLoading: isLoadingPro } = useProDetail(proId || undefined);

  // Booking creation hook
  const { createBooking, isPending, error: createError } = useCreateBooking();

  // Calculate estimated cost
  const estimatedCost =
    pro && hours ? parseFloat(hours) * pro.hourlyRate : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proId || !category || !date || !time || !address || !hours) {
      return;
    }

    // Combine date and time into scheduledAt
    const scheduledAt = new Date(`${date}T${time}`);

    try {
      await createBooking({
        proId,
        category: category as Category,
        description: `Servicio en ${address}`,
        scheduledAt,
        estimatedHours: parseFloat(hours),
      });
      // Success - hook's onSuccess will handle redirect
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  if (!proId) {
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

  if (isLoadingPro) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="body" className="text-muted">
                Cargando información del profesional...
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
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
