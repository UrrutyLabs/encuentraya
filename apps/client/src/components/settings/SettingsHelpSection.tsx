import { HelpCircle, Mail, AlertCircle } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";

interface SettingsHelpSectionProps {
  onHelpCenterClick?: () => void;
  onContactSupportClick?: () => void;
  onReportProblemClick?: () => void;
}

export function SettingsHelpSection({
  onHelpCenterClick,
  onContactSupportClick,
  onReportProblemClick,
}: SettingsHelpSectionProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {onHelpCenterClick && (
          <Button
            variant="ghost"
            onClick={onHelpCenterClick}
            className="w-full justify-start flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            <Text variant="body" className="text-text">
              Centro de ayuda
            </Text>
          </Button>
        )}

        {onContactSupportClick && (
          <Button
            variant="ghost"
            onClick={onContactSupportClick}
            className="w-full justify-start flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <Text variant="body" className="text-text">
              Contactar soporte
            </Text>
          </Button>
        )}

        {onReportProblemClick && (
          <Button
            variant="ghost"
            onClick={onReportProblemClick}
            className="w-full justify-start flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            <Text variant="body" className="text-text">
              Reportar problema
            </Text>
          </Button>
        )}

        {!onHelpCenterClick &&
          !onContactSupportClick &&
          !onReportProblemClick && (
            <Text variant="body" className="text-muted text-center py-4">
              Las opciones de ayuda estarán disponibles próximamente
            </Text>
          )}
      </div>
    </Card>
  );
}
