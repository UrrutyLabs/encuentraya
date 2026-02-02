"use client";

import { MapPin, Hourglass } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Input } from "@repo/ui";

interface LocationStepContentProps {
  address: string;
  hours: string;
  onAddressChange: (value: string) => void;
  onHoursChange: (value: string) => void;
  estimatedCost?: number;
  /** When true, hide hours input and show message that pro will send quote */
  isFixedPrice?: boolean;
}

/**
 * Presentational: Card with address + hours inputs (or fixed-price message) + estimated cost display
 */
export function LocationStepContent({
  address,
  hours,
  onAddressChange,
  onHoursChange,
  estimatedCost,
  isFixedPrice = false,
}: LocationStepContentProps) {
  return (
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
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Ingresá la dirección donde se realizará el trabajo"
            required
            className="text-base md:text-sm py-3 md:py-2"
          />
        </div>

        {/* Hours (hourly) or message (fixed-price) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2 md:mb-2">
            <Hourglass className="w-4 h-4 text-muted" />
            {isFixedPrice ? "Presupuesto" : "Horas estimadas"}
          </label>
          {isFixedPrice ? (
            <Text variant="body" className="text-muted">
              El profesional te enviará un presupuesto después de aceptar el
              trabajo.
            </Text>
          ) : (
            <>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={hours}
                onChange={(e) => onHoursChange(e.target.value)}
                placeholder="Ej: 2.5"
                required
                className="text-base md:text-sm py-3 md:py-2"
              />
              <Text variant="small" className="text-muted mt-2">
                Estimá cuántas horas necesitarás para completar el trabajo
              </Text>
            </>
          )}
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
  );
}
