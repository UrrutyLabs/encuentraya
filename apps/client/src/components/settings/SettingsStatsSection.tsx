import { Calendar, CheckCircle, Tag } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { JOB_LABELS } from "@/utils/jobLabels";

interface SettingsStatsSectionProps {
  totalJobs?: number;
  completedJobs?: number;
  totalSpent?: number;
  favoriteCategory?: string;
}

export function SettingsStatsSection({
  totalJobs,
  completedJobs,
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
        {totalJobs !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted" />
              <Text variant="body" className="text-text">
                {JOB_LABELS.jobsCompleted}
              </Text>
            </div>
            <Text variant="body" className="text-text font-semibold">
              {totalJobs}
            </Text>
          </div>
        )}

        {completedJobs !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-muted" />
              <Text variant="body" className="text-text">
                {JOB_LABELS.jobsCompletedLabel}
              </Text>
            </div>
            <Text variant="body" className="text-text font-semibold">
              {completedJobs}
            </Text>
          </div>
        )}

        {totalSpent !== undefined && (
          <div className="flex items-center justify-between">
            <Text variant="body" className="text-text">
              Total gastado
            </Text>
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

        {totalJobs === undefined &&
          completedJobs === undefined &&
          totalSpent === undefined &&
          !favoriteCategory && (
            <Text variant="body" className="text-muted text-center py-4">
              Las estadísticas aparecerán aquí después de realizar trabajos
            </Text>
          )}
      </div>
    </Card>
  );
}
