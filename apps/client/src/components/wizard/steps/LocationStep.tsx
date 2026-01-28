"use client";

import { useState, useMemo } from "react";
import { MapPin, Hourglass } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Input } from "@repo/ui";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { useProDetail } from "@/hooks/pro";
import { useRebookTemplate } from "@/hooks/order";

interface LocationStepProps {
  onNext?: () => void;
  onBack?: () => void;
}

export function LocationStep({}: LocationStepProps) {
  const { state, updateState, navigateToStep } = useWizardState();
  const { data: rebookTemplate } = useRebookTemplate(
    state.rebookFrom || undefined
  );

  // Use rebook values if available, otherwise use state
  const initialAddress = state.address || rebookTemplate?.addressText || "";
  const initialHours =
    state.hours || rebookTemplate?.estimatedHours.toString() || "";

  const [address, setAddress] = useState(initialAddress);
  const [hours, setHours] = useState(initialHours);

  const { pro } = useProDetail(state.proId || undefined);

  const canProceed = useMemo(() => {
    return !!(address.trim() && hours && parseFloat(hours) > 0);
  }, [address, hours]);

  const estimatedCost = useMemo(() => {
    if (!pro || !hours) return undefined;
    return parseFloat(hours) * pro.hourlyRate;
  }, [pro, hours]);

  const handleNext = () => {
    if (!canProceed) return;

    // Navigate to next step with updated state values
    navigateToStep("review", {
      address,
      hours,
    });
  };

  const handleBack = () => {
    navigateToStep("service-details");
  };

  if (!state.proId || !state.category || !state.date || !state.time) {
    return (
      <Card className="p-4 md:p-6">
        <Text variant="h2" className="mb-2 text-text">
          Información incompleta
        </Text>
        <Text variant="body" className="text-muted">
          Por favor, completá los pasos anteriores primero.
        </Text>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Text variant="h1" className="mb-2 text-primary">
          Ubicación y duración
        </Text>
        <Text variant="body" className="text-muted">
          Dónde y cuánto tiempo necesitás el servicio
        </Text>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-5 md:space-y-6">
          {/* Address */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2 md:mb-2">
              <MapPin className="w-4 h-4 text-muted" />
              Dirección
            </label>
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ingresá la dirección donde se realizará el trabajo"
              required
              className="text-base md:text-sm py-3 md:py-2"
            />
          </div>

          {/* Hours */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2 md:mb-2">
              <Hourglass className="w-4 h-4 text-muted" />
              Horas estimadas
            </label>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Ej: 2.5"
              required
              className="text-base md:text-sm py-3 md:py-2"
            />
            <Text variant="small" className="text-muted mt-2">
              Estimá cuántas horas necesitarás para completar el trabajo
            </Text>
          </div>

          {/* Estimated Cost */}
          {estimatedCost !== undefined && (
            <div className="p-4 md:p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <Text variant="body" className="text-text font-medium">
                  Costo estimado:
                </Text>
                <Text variant="h2" className="text-primary">
                  ${estimatedCost.toFixed(0)}
                </Text>
              </div>
              <Text variant="small" className="text-muted mt-1">
                Basado en las horas estimadas y la tarifa del profesional
              </Text>
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-6">
        <button
          onClick={handleBack}
          className="min-h-[44px] px-6 py-3 md:py-2 border border-border rounded-lg font-medium text-base md:text-sm hover:bg-surface active:bg-surface/80 transition-colors touch-manipulation w-full md:w-auto"
        >
          Atrás
        </button>
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
