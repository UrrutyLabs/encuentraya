"use client";

import { useState, useEffect, useMemo, useRef, startTransition } from "react";
import { Filter, Calendar, Clock } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Input } from "@repo/ui";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { useProDetail } from "@/hooks/pro";
import { useTodayDate } from "@/hooks/shared";
import { useAvailableOrderTimes } from "@/hooks/order";
import { useRebookTemplate } from "@/hooks/order";
import { useCategories } from "@/hooks/category";
import { useCategoryBySlug } from "@/hooks/category";
import { useCategory } from "@/hooks/category";

interface ServiceDetailsStepProps {
  onNext?: () => void;
}

export function ServiceDetailsStep({}: ServiceDetailsStepProps) {
  const { state, updateState, navigateToStep } = useWizardState();
  const today = useTodayDate();
  const { categories } = useCategories();

  // Fetch rebook template if rebookFrom is present
  const { data: rebookTemplate, isLoading: isLoadingRebook } =
    useRebookTemplate(state.rebookFrom || undefined);

  // Fetch category from rebook template to get slug
  const { category: rebookCategory } = useCategory(
    rebookTemplate?.categoryId || undefined
  );

  // Derive initial values from rebook template
  const rebookValues = useMemo(() => {
    if (rebookTemplate && rebookCategory) {
      return {
        categorySlug: rebookCategory.slug,
        address: rebookTemplate.addressText,
        hours: rebookTemplate.estimatedHours.toString(),
      };
    }
    return null;
  }, [rebookTemplate, rebookCategory]);

  // Fetch category by slug from URL
  const { category: urlCategory } = useCategoryBySlug(
    state.categorySlug || undefined
  );

  // Determine proId: from rebook template or query param
  const effectiveProId = rebookTemplate?.proProfileId || state.proId;

  // Use category from URL or rebook template
  const selectedCategory = urlCategory || rebookCategory;
  const [categoryId, setCategoryId] = useState<string | "">(
    selectedCategory?.id || ""
  );
  const [date, setDate] = useState(state.date || "");
  const [time, setTime] = useState(state.time || "");

  const { pro, isLoading: isLoadingPro } = useProDetail(
    effectiveProId || undefined
  );

  // Track previous rebookValues to update state only when template first loads
  const prevRebookValuesRef = useRef(rebookValues);

  // Update form fields when rebook template or URL category first becomes available
  useEffect(() => {
    const prevValues = prevRebookValuesRef.current;
    if (rebookValues && prevValues !== rebookValues) {
      prevRebookValuesRef.current = rebookValues;
      startTransition(() => {
        if (selectedCategory && categoryId !== selectedCategory.id) {
          setCategoryId(selectedCategory.id);
        }
      });
    } else if (selectedCategory && categoryId !== selectedCategory.id) {
      startTransition(() => {
        setCategoryId(selectedCategory.id);
      });
    }
  }, [rebookValues, selectedCategory, categoryId]);

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
      categoryId &&
      date &&
      time &&
      effectiveProId &&
      pro &&
      pro.categoryIds.includes(categoryId)
    );
  }, [categoryId, date, time, effectiveProId, pro]);

  const handleNext = () => {
    if (!canProceed) return;

    // Find selected category object to get slug
    const selectedCategoryObj = categories.find((c) => c.id === categoryId);

    // Navigate to next step with updated state values
    const updatedParams: Record<string, string> = {
      proId: effectiveProId!,
      categorySlug: selectedCategoryObj?.slug || "",
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

  // Filter categories based on pro's available categoryIds
  const availableCategories = useMemo(() => {
    if (!pro?.categoryIds || categories.length === 0) return [];
    return categories.filter((category) =>
      pro.categoryIds.includes(category.id)
    );
  }, [pro, categories]);

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
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-3 md:px-3 md:py-2 border border-border rounded-lg md:rounded-md bg-surface text-text text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent touch-manipulation"
            >
              <option value="">Seleccionar categoría</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
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
