"use client";

import { useMemo } from "react";
import {
  User,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Hourglass,
  DollarSign,
} from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { useProDetail } from "@/hooks/pro";
import { useCreateOrder } from "@/hooks/order";
import { useCategoryBySlug } from "@/hooks/category";
import { logger } from "@/lib/logger";

interface ReviewStepProps {
  onBack?: () => void;
}

export function ReviewStep({}: ReviewStepProps) {
  const { state, navigateToStep } = useWizardState();
  const { pro } = useProDetail(state.proId || undefined);
  // Fetch category by slug from URL
  const { category } = useCategoryBySlug(state.categorySlug || undefined);
  const { createOrder, isPending, error: createError } = useCreateOrder();

  const estimatedCost = useMemo(() => {
    if (!pro || !state.hours) return 0;
    return parseFloat(state.hours) * pro.hourlyRate;
  }, [pro, state.hours]);

  const formattedDate = useMemo(() => {
    if (!state.date) return "";
    const date = new Date(state.date);
    return date.toLocaleDateString("es-UY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [state.date]);

  const formattedTime = useMemo(() => {
    if (!state.time) return "";
    const [hours, minutes] = state.time.split(":");
    return `${hours}:${minutes}`;
  }, [state.time]);

  const handleBack = () => {
    navigateToStep("location");
  };

  const handleSubmit = async () => {
    if (
      !state.proId ||
      !category?.id ||
      !state.date ||
      !state.time ||
      !state.address ||
      !state.hours
    ) {
      return;
    }

    const scheduledAt = new Date(`${state.date}T${state.time}`);

    try {
      await createOrder({
        proProfileId: state.proId,
        categoryId: category.id,
        description: `Servicio en ${state.address}`,
        addressText: state.address,
        scheduledWindowStartAt: scheduledAt,
        estimatedHours: parseFloat(state.hours),
      });
      // Success - hook's onSuccess will handle redirect
    } catch (error) {
      logger.error(
        "Error creating order",
        error instanceof Error ? error : new Error(String(error)),
        {
          proProfileId: state.proId,
          categoryId: category.id,
        }
      );
    }
  };

  if (
    !state.proId ||
    !category ||
    !state.date ||
    !state.time ||
    !state.address ||
    !state.hours
  ) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Información incompleta
        </Text>
        <Text variant="body" className="text-muted">
          Por favor, completá todos los pasos anteriores.
        </Text>
      </Card>
    );
  }

  if (!pro) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Cargando información...
        </Text>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Text variant="h1" className="mb-2 text-primary">
          Revisar y confirmar
        </Text>
        <Text variant="body" className="text-muted">
          Revisá los detalles antes de confirmar tu trabajo
        </Text>
      </div>

      <Card className="p-4 md:p-6 mb-6">
        <div className="space-y-4 md:space-y-4">
          {/* Professional */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-muted shrink-0 mt-0.5" />
            <div className="flex-1">
              <Text variant="small" className="text-muted">
                Profesional
              </Text>
              <Text variant="body" className="font-medium">
                {pro.name}
              </Text>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-start gap-3">
            <Filter className="w-5 h-5 text-muted shrink-0 mt-0.5" />
            <div className="flex-1">
              <Text variant="small" className="text-muted">
                Categoría
              </Text>
              <Text variant="body" className="font-medium">
                {category?.name || "Cargando..."}
              </Text>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted shrink-0 mt-0.5" />
            <div className="flex-1">
              <Text variant="small" className="text-muted">
                Fecha
              </Text>
              <Text variant="body" className="font-medium capitalize">
                {formattedDate}
              </Text>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted shrink-0 mt-0.5" />
            <div className="flex-1">
              <Text variant="small" className="text-muted">
                Hora
              </Text>
              <Text variant="body" className="font-medium">
                {formattedTime}
              </Text>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted shrink-0 mt-0.5" />
            <div className="flex-1">
              <Text variant="small" className="text-muted">
                Dirección
              </Text>
              <Text variant="body" className="font-medium">
                {state.address}
              </Text>
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-start gap-3">
            <Hourglass className="w-5 h-5 text-muted shrink-0 mt-0.5" />
            <div className="flex-1">
              <Text variant="small" className="text-muted">
                Horas estimadas
              </Text>
              <Text variant="body" className="font-medium">
                {state.hours} horas
              </Text>
            </div>
          </div>

          {/* Cost */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <Text variant="body" className="font-medium">
                  Costo estimado
                </Text>
              </div>
              <Text variant="h2" className="text-primary">
                ${estimatedCost.toFixed(0)}
              </Text>
            </div>
            <Text variant="small" className="text-muted mt-1">
              ${pro.hourlyRate.toFixed(0)}/hora × {state.hours} horas
            </Text>
          </div>
        </div>
      </Card>

      {createError && (
        <Card className="p-4 mb-6 bg-danger/10 border-danger/20">
          <Text variant="small" className="text-danger">
            {createError.message || "Error al crear el trabajo"}
          </Text>
        </Card>
      )}

      <div className="flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={isPending}
          className="min-h-[44px] w-full md:w-auto text-base md:text-sm py-3 md:py-2"
        >
          Atrás
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isPending}
          className="min-h-[44px] w-full md:w-auto text-base md:text-sm py-3 md:py-2"
        >
          {isPending ? "Creando trabajo..." : "Confirmar trabajo"}
        </Button>
      </div>
    </div>
  );
}
