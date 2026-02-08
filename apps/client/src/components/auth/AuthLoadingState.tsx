import { Loader2 } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { AppShell } from "@/components/presentational/AppShell";

interface AuthLoadingStateProps {
  maxWidth?: string;
}

/**
 * Presentational component for authentication loading state
 * Pure UI component - no logic, just renders loading state
 */
export function AuthLoadingState({
  maxWidth = "max-w-4xl",
}: AuthLoadingStateProps) {
  return (
    <AppShell showLogin={false}>
      <div className="px-4 py-8">
        <div className={`${maxWidth} mx-auto`}>
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <Text variant="body" className="text-muted">
                Verificando autenticación...
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
