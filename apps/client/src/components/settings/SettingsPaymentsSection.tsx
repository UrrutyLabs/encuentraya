import { CreditCard } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";

export function SettingsPaymentsSection() {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-muted" />
        </div>
        <div className="text-center space-y-2">
          <Text variant="h2" className="text-text">
            Métodos de pago
          </Text>
          <Text variant="body" className="text-muted max-w-md">
            Los métodos de pago estarán disponibles próximamente. Podrás agregar tarjetas y gestionar tus pagos desde aquí.
          </Text>
        </div>
      </div>
    </Card>
  );
}
