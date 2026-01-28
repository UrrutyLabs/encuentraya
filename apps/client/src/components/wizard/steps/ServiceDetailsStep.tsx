"use client";

import { useState, useEffect, useMemo, useRef, startTransition } from "react";
import { Filter, Calendar, Clock } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Input } from "@repo/ui";
import { Category } from "@repo/domain";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { useProDetail } from "@/hooks/pro";
import { useTodayDate } from "@/hooks/shared";
import { useAvailableOrderTimes } from "@/hooks/order";
import { useRebookTemplate } from "@/hooks/order";

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: Category.PLUMBING, label: "Plomería" },
  { value: Category.ELECTRICAL, label: "Electricidad" },
  { value: Category.CLEANING, label: "Limpieza" },
  { value: Category.HANDYMAN, label: "Arreglos generales" },
  { value: Category.PAINTING, label: "Pintura" },
];

interface ServiceDetailsStepProps {
  onNext?: () => void;
}

export function ServiceDetailsStep({}: ServiceDetailsStepProps) {
  const { state, updateState, navigateToStep } = useWizardState();
  const today = useTodayDate();

  // Fetch rebook template if rebookFrom is present
  const { data: rebookTemplate, isLoading: isLoadingRebook } =
    useRebookTemplate(state.rebookFrom || undefined);

  // Derive initial values from rebook template
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

  // Determine proId: from rebook template or query param
  const effectiveProId = rebookTemplate?.proProfileId || state.proId;

  const [category, setCategory] = useState<Category | "">(
    state.category || rebookValues?.category || ""
  );
  const [date, setDate] = useState(state.date || "");
  const [time, setTime] = useState(state.time || "");

  const { pro, isLoading: isLoadingPro } = useProDetail(
    effectiveProId || undefined
  );

  // Track previous rebookValues to update state only when template first loads
  const prevRebookValuesRef = useRef(rebookValues);

  // Update form fields when rebook template first becomes available
  useEffect(() => {
    const prevValues = prevRebookValuesRef.current;
    if (rebookValues && prevValues !== rebookValues) {
      prevRebookValuesRef.current = rebookValues;
      startTransition(() => {
        if (category !== rebookValues.category) {
          setCategory(rebookValues.category);
        }
      });
    }
  }, [rebookValues, category]);

  const { availableTimes, handleDateChange: handleDateChangeWithValidation } =
    useAvailableOrderTimes(date, today, time, setTime, {
      minBufferMinutes: 60,
      startHour: 9,
      endHour: 18,
      availabilitySlots: pro?.availabilitySlots,
    });

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    handleDateChangeWithValidation(newDate);
  };

  const canProceed = useMemo(() => {
    return !!(
      category &&
      date &&
      time &&
      effectiveProId &&
      pro &&
      pro.categories.includes(category as Category)
    );
  }, [category, date, time, effectiveProId, pro]);

  const handleNext = () => {
    if (!canProceed) return;

    // Navigate to next step with updated state values
    const updatedParams: Record<string, string> = {
      proId: effectiveProId!,
      category: category as Category,
      date,
      time,
    };

    // If rebooking, also set address and hours from template
    if (rebookValues) {
      updatedParams.address = rebookValues.address;
      updatedParams.hours = rebookValues.hours;
    }

    navigateToStep("location", updatedParams);
  };

  // Filter categories based on pro's available categories
  const availableCategories = useMemo(() => {
    if (!pro?.categories) return CATEGORY_OPTIONS;
    return CATEGORY_OPTIONS.filter((option) =>
      pro.categories.includes(option.value)
    );
  }, [pro]);

  if (isLoadingRebook || isLoadingPro) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Cargando...
        </Text>
      </Card>
    );
  }

  if (!effectiveProId) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Profesional no especificado
        </Text>
        <Text variant="body" className="text-muted">
          Por favor, seleccioná un profesional desde la búsqueda.
        </Text>
      </Card>
    );
  }

  if (!pro) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Profesional no encontrado
        </Text>
        <Text variant="body" className="text-muted">
          El profesional seleccionado no existe o fue eliminado.
        </Text>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Text variant="h1" className="mb-2 text-primary">
          Detalles del servicio
        </Text>
        <Text variant="body" className="text-muted">
          Con {pro.name} - ${pro.hourlyRate.toFixed(0)}/hora
        </Text>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-5 md:space-y-6">
          {/* Category */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2 md:mb-2">
              <Filter className="w-4 h-4 text-muted" />
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | "")}
              required
              className="w-full px-4 py-3 md:px-3 md:py-2 border border-border rounded-lg md:rounded-md bg-surface text-text text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent touch-manipulation"
            >
              <option value="">Seleccionar categoría</option>
              {availableCategories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text mb-2 md:mb-2">
                <Calendar className="w-4 h-4 text-muted" />
                Fecha
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={today}
                required
                className="text-base md:text-sm py-3 md:py-2"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text mb-2 md:mb-2">
                <Clock className="w-4 h-4 text-muted" />
                Hora
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                disabled={!date}
                className="w-full px-4 py-3 md:px-3 md:py-2 border border-border rounded-lg md:rounded-md bg-surface text-text text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                <option value="">
                  {date ? "Seleccionar hora" : "Seleccionar fecha primero"}
                </option>
                {availableTimes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end mt-6 md:mt-6">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="min-h-[44px] px-6 py-3 md:py-2 bg-primary text-white rounded-lg font-medium text-base md:text-sm hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation w-full md:w-auto"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
