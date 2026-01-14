"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Mail,
  Phone,
  MessageCircle,
  Save,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Select } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { useClientProfile } from "@/hooks/useClientProfile";
import type { PreferredContactMethod } from "@repo/domain";

export function SettingsScreen() {
  const router = useRouter();

  // Fetch current profile
  const { profile, isLoading } = useClientProfile();

  // Derive initial form values from profile
  const initialValues = useMemo(
    () => ({
      phone: profile?.phone || "",
      preferredContactMethod: (profile?.preferredContactMethod || "") as
        | PreferredContactMethod
        | "",
    }),
    [profile]
  );

  const [phone, setPhone] = useState(initialValues.phone);
  const [preferredContactMethod, setPreferredContactMethod] =
    useState<PreferredContactMethod | "">(initialValues.preferredContactMethod);

  // Update mutation
  const updateMutation = trpc.clientProfile.update.useMutation({
    onSuccess: () => {
      router.push("/my-bookings");
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      phone: phone || null,
      preferredContactMethod:
        (preferredContactMethod as PreferredContactMethod) || null,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <Text variant="body" className="text-muted">
                  Cargando...
                </Text>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-6 h-6 text-primary" />
            <Text variant="h1" className="text-primary">
              Notificaciones
            </Text>
          </div>

          <Card className="p-6">
            <form
              key={profile?.id || "new"}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {profile?.email && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted" />
                    <Text variant="small" className="text-muted">
                      Email
                    </Text>
                  </div>
                  <Text variant="body" className="text-text">
                    {profile.email}
                  </Text>
                  <Text variant="xs" className="text-muted">
                    El email no se puede cambiar desde aquí
                  </Text>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
                  <Phone className="w-4 h-4 text-muted" />
                  Teléfono
                </label>
                <Input
                  type="tel"
                  placeholder="+598..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
                  <MessageCircle className="w-4 h-4 text-muted" />
                  Método de contacto preferido
                </label>
                <Select
                  value={preferredContactMethod}
                  onChange={(e) =>
                    setPreferredContactMethod(
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

              {updateMutation.error && (
                <Card className="p-4 bg-danger/10 border-danger/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                    <Text variant="body" className="text-danger">
                      {updateMutation.error.message ||
                        "No se pudo guardar. Probá de nuevo."}
                    </Text>
                  </div>
                </Card>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
