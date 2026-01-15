import { Calendar, CheckCircle, DollarSign, Tag } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";

interface SettingsStatsSectionProps {
  totalBookings?: number;
  completedBookings?: number;
  totalSpent?: number;
  favoriteCategory?: string;
}

export function SettingsStatsSection({
  totalBookings,
  completedBookings,
  totalSpent,
  favoriteCategory,
}: SettingsStatsSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: "UYU",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {totalBookings !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted" />
              <Text variant="body" className="text-text">
                Reservas realizadas
              </Text>
            </div>
            <Text variant="body" className="text-text font-semibold">
              {totalBookings}
            </Text>
          </div>
        )}

        {completedBookings !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-muted" />
              <Text variant="body" className="text-text">
                Completadas
              </Text>
            </div>
            <Text variant="body" className="text-text font-semibold">
              {completedBookings}
            </Text>
          </div>
        )}

        {totalSpent !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted" />
              <Text variant="body" className="text-text">
                Total gastado
              </Text>
            </div>
            <Text variant="body" className="text-text font-semibold">
              {formatCurrency(totalSpent)}
            </Text>
          </div>
        )}

        {favoriteCategory && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted" />
              <Text variant="body" className="text-text">
                Categoría favorita
              </Text>
            </div>
            <Text variant="body" className="text-text font-semibold">
              {favoriteCategory}
            </Text>
          </div>
        )}

        {totalBookings === undefined &&
          completedBookings === undefined &&
          totalSpent === undefined &&
          !favoriteCategory && (
            <Text variant="body" className="text-muted text-center py-4">
              Las estadísticas aparecerán aquí después de realizar reservas
            </Text>
          )}
      </div>
    </Card>
  );
}
