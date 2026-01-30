import { Clock } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import type { AvailabilitySlot } from "@repo/domain";
import { getDayName } from "@/utils/date";

interface ProAvailabilityProps {
  availabilitySlots: AvailabilitySlot[];
}

/**
 * Pro Availability Component
 * Displays availability slots in format: "Day - start hour - end hour"
 */
export function ProAvailability({ availabilitySlots }: ProAvailabilityProps) {
  if (!availabilitySlots || availabilitySlots.length === 0) {
    return (
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <Text variant="h2" className="text-text">
            Disponibilidad
          </Text>
        </div>
        <Text variant="body" className="text-muted">
          No hay disponibilidad configurada.
        </Text>
      </Card>
    );
  }

  // Sort slots by dayOfWeek (0 = Sunday, 6 = Saturday)
  const sortedSlots = [...availabilitySlots].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek
  );

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <Text variant="h2" className="text-text">
          Disponibilidad
        </Text>
      </div>
      <div className="space-y-2">
        {sortedSlots.map((slot) => (
          <div key={slot.id} className="flex items-center gap-2">
            <Text
              variant="body"
              className="text-text font-medium min-w-[100px]"
            >
              {getDayName(slot.dayOfWeek)}:
            </Text>
            <Text variant="body" className="text-text">
              {slot.startTime} - {slot.endTime}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}
