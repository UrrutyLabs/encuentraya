"use client";

import { useRef } from "react";
import {
  Mail,
  Phone,
  User,
  Calendar,
  MessageCircle,
  Camera,
} from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Input } from "@repo/ui";
import { Select } from "@repo/ui";
import { Button } from "@repo/ui";
import { Avatar } from "@repo/ui";
import { formatDateLong } from "@/utils/date";
import type { PreferredContactMethod } from "@repo/domain";
import { useUploadClientAvatar } from "@/hooks/upload";

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
  avatarUrl?: string | null;
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
  avatarUrl,
  preferredContactMethod = "",
  onPhoneChange,
  onPreferredContactMethodChange,
  createdAt,
}: SettingsProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, isUploading, error } = useUploadClientAvatar();
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;
  const preferredContactLabel = preferredContactMethod
    ? (PREFERRED_CONTACT_LABELS[preferredContactMethod] ??
      preferredContactMethod)
    : null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Avatar + Cambiar foto */}
        <div className="flex flex-col items-center gap-3">
          <Avatar
            avatarUrl={avatarUrl ?? undefined}
            name={displayName ?? "Usuario"}
            size="xl"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4 mr-1.5" />
            {isUploading ? "Subiendo..." : "Cambiar foto"}
          </Button>
          {error && (
            <Text variant="xs" className="text-destructive">
              {error.message}
            </Text>
          )}
        </div>

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
