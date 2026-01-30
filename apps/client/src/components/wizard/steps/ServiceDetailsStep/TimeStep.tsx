"use client";

import { Clock } from "lucide-react";
import { Card } from "@repo/ui";

interface TimeOption {
  value: string;
  label: string;
}

interface TimeStepProps {
  time: string;
  date: string;
  availableTimes: TimeOption[];
  onTimeChange: (time: string) => void;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
}

/**
 * TimeStep Component
 *
 * Renders the time selection step
 * Shows time dropdown with available times based on pro's availability
 */
export function TimeStep({
  time,
  date,
  availableTimes,
  onTimeChange,
  onBack,
  onNext,
  canProceed,
}: TimeStepProps) {
  return (
    <div className="animate-in fade-in duration-200">
      <Card className="p-4 md:p-6">
        <div className="space-y-5 md:space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2 md:mb-2">
              <Clock className="w-4 h-4 text-muted" />
              Hora
            </label>
            <select
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
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
      </Card>

      <div className="flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-6">
        <button
          onClick={onBack}
          aria-label="Volver a disponibilidad"
          className="min-h-[44px] px-6 py-3 md:py-2 border border-border rounded-lg font-medium text-base md:text-sm hover:bg-surface active:bg-surface/80 transition-colors touch-manipulation w-full md:w-auto"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          aria-label="Continuar a ubicación y duración"
          className="min-h-[44px] px-6 py-3 md:py-2 bg-primary text-white rounded-lg font-medium text-base md:text-sm hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation w-full md:w-auto"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
