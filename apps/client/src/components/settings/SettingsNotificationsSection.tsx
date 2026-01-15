import { MessageCircle } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Select } from "@repo/ui";
import type { PreferredContactMethod } from "@repo/domain";

interface SettingsNotificationsSectionProps {
  preferredContactMethod: PreferredContactMethod | "";
  onPreferredContactMethodChange: (value: PreferredContactMethod | "") => void;
}

export function SettingsNotificationsSection({
  preferredContactMethod,
  onPreferredContactMethodChange,
}: SettingsNotificationsSectionProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
            <MessageCircle className="w-4 h-4 text-muted" />
            Método de contacto preferido
          </label>
          <Select
            value={preferredContactMethod}
            onChange={(e) =>
              onPreferredContactMethodChange(
                e.target.value as PreferredContactMethod | ""
              )
            }
          >
            <option value="">Seleccionar...</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="PHONE">Teléfono</option>
          </Select>
        </div>
      </div>
    </Card>
  );
}
