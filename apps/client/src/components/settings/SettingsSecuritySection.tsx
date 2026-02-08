import { Lock, LogOut, Trash2 } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";

interface SettingsSecuritySectionProps {
  onChangePasswordClick?: () => void;
  onDeleteAccountClick?: () => void;
  onSignOutClick?: () => void;
}

export function SettingsSecuritySection({
  onChangePasswordClick,
  onDeleteAccountClick,
  onSignOutClick,
}: SettingsSecuritySectionProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {onSignOutClick && (
          <Button
            variant="ghost"
            onClick={onSignOutClick}
            className="w-full justify-start flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <Text variant="body" className="text-text">
              Cerrar sesión
            </Text>
          </Button>
        )}

        {onChangePasswordClick && (
          <Button
            variant="ghost"
            onClick={onChangePasswordClick}
            className="w-full justify-start flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <Text variant="body" className="text-text">
              Cambiar contraseña
            </Text>
          </Button>
        )}

        {onDeleteAccountClick && (
          <Button
            variant="ghost"
            onClick={onDeleteAccountClick}
            className="w-full justify-start flex items-center gap-2 text-danger hover:text-danger"
          >
            <Trash2 className="w-4 h-4" />
            <Text variant="body" className="text-danger">
              Eliminar cuenta
            </Text>
          </Button>
        )}

        {!onChangePasswordClick && !onDeleteAccountClick && !onSignOutClick && (
          <Text variant="body" className="text-muted text-center py-4">
            Las opciones de seguridad estarán disponibles próximamente
          </Text>
        )}
      </div>
    </Card>
  );
}
