import { Mail, Phone, User, Calendar } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Input } from "@repo/ui";

interface SettingsProfileSectionProps {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone: string;
  createdAt?: Date;
  onPhoneChange: (value: string) => void;
}

export function SettingsProfileSection({
  email,
  firstName,
  lastName,
  phone,
  createdAt,
  onPhoneChange,
}: SettingsProfileSectionProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-UY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Email (read-only) */}
        {email && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted" />
              <Text variant="small" className="text-muted">
                Email
              </Text>
            </div>
            <Text variant="body" className="text-text">
              {email}
            </Text>
            <Text variant="xs" className="text-muted">
              El email no se puede cambiar desde aquí
            </Text>
          </div>
        )}

        {/* Name fields (read-only if available) */}
        {(firstName || lastName) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted" />
              <Text variant="small" className="text-muted">
                Nombre
              </Text>
            </div>
            <Text variant="body" className="text-text">
              {[firstName, lastName].filter(Boolean).join(" ") ||
                "No especificado"}
            </Text>
          </div>
        )}

        {/* Phone (editable) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
            <Phone className="w-4 h-4 text-muted" />
            Teléfono
          </label>
          <Input
            type="tel"
            placeholder="+598..."
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </div>

        {/* Account creation date (read-only) */}
        {createdAt && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted" />
              <Text variant="small" className="text-muted">
                Miembro desde
              </Text>
            </div>
            <Text variant="body" className="text-text">
              {formatDate(createdAt)}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
}
