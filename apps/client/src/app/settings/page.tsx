import { SettingsScreen } from "@/screens/settings/SettingsScreen";
import { AuthenticatedGuard } from "@/components/auth/AuthenticatedGuard";
import { Role } from "@repo/domain";

export default function SettingsPage() {
  return (
    <AuthenticatedGuard
      returnUrl="/settings"
      maxWidth="max-w-7xl"
      requiredRole={Role.CLIENT}
    >
      <SettingsScreen />
    </AuthenticatedGuard>
  );
}
