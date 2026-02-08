import { Mail, Phone, User, Calendar, MessageCircle } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Input } from "@repo/ui";
import { Select } from "@repo/ui";
import { formatDateLong } from "@/utils/date";
import type { PreferredContactMethod } from "@repo/domain";

const PREFERRED_CONTACT_LABELS: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  PHONE: "Teléfono",
};

interface SettingsProfileSectionProps {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone: string;
  preferredContactMethod?: PreferredContactMethod | "";
  onPhoneChange: (value: string) => void;
  onPreferredContactMethodChange?: (value: PreferredContactMethod | "") => void;
  createdAt?: Date;
}

export function SettingsProfileSection({
  email,
  firstName,
  lastName,
  phone,
  preferredContactMethod = "",
  onPhoneChange,
  onPreferredContactMethodChange,
  createdAt,
}: SettingsProfileSectionProps) {
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;
  const preferredContactLabel = preferredContactMethod
    ? (PREFERRED_CONTACT_LABELS[preferredContactMethod] ??
      preferredContactMethod)
    : null;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Nombre (read-only) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted" />
            <Text variant="small" className="text-muted">
              Nombre
            </Text>
          </div>
          <Text variant="body" className="text-text">
            {displayName ?? "No agregado"}
          </Text>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted" />
            <Text variant="small" className="text-muted">
              Email
            </Text>
          </div>
          <Text variant="body" className="text-text">
            {email ?? "No agregado"}
          </Text>
          {email && (
            <Text variant="xs" className="text-muted">
              El email no se puede cambiar desde aquí
            </Text>
          )}
        </div>

        {/* Teléfono (editable) */}
        <div>
          <label
            htmlFor="settings-phone"
            className="flex items-center gap-2 text-sm font-medium text-text mb-1"
          >
            <Phone className="w-4 h-4 text-muted" />
            Teléfono
          </label>
          <Input
            id="settings-phone"
            type="tel"
            placeholder="+598..."
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
          {!phone && (
            <Text variant="xs" className="text-muted mt-1">
              No agregado
            </Text>
          )}
        </div>

        {/* Preferencia de contacto (editable inline) */}
        {onPreferredContactMethodChange && (
          <div>
            <label
              htmlFor="settings-preferred-contact"
              className="flex items-center gap-2 text-sm font-medium text-text mb-1"
            >
              <MessageCircle className="w-4 h-4 text-muted" />
              Método de contacto preferido
            </label>
            <Select
              id="settings-preferred-contact"
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
            {!preferredContactLabel && (
              <Text variant="xs" className="text-muted mt-1">
                No seleccionado
              </Text>
            )}
          </div>
        )}

        {/* Miembro desde (read-only) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted" />
            <Text variant="small" className="text-muted">
              Miembro desde
            </Text>
          </div>
          <Text variant="body" className="text-text">
            {createdAt ? formatDateLong(createdAt) : "—"}
          </Text>
        </div>
      </div>
    </Card>
  );
}
