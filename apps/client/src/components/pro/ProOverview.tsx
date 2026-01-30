import { CheckCircle2, MapPin } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { formatCompletedJobs } from "@/utils/proFormatting";

interface ProOverviewProps {
  completedJobsCount: number;
  serviceArea?: string;
}

/**
 * Pro Overview Component
 * Displays completed jobs count and location
 */
export function ProOverview({
  completedJobsCount,
  serviceArea,
}: ProOverviewProps) {
  return (
    <Card className="p-4 md:p-6">
      <Text variant="h2" className="text-text mb-4">
        Resumen
      </Text>
      <div className="space-y-3">
        {/* Completed Jobs */}
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <Text variant="body" className="text-text">
            {formatCompletedJobs(completedJobsCount)}
          </Text>
        </div>

        {/* Location */}
        {serviceArea && (
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <Text variant="body" className="text-text">
              {serviceArea}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
}
