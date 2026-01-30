import { Calendar } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";

interface ProRequestFormProps {
  hourlyRate: number;
  proId: string;
  onContratar: () => void;
  disabled?: boolean;
  /**
   * Whether this is displayed in a mobile footer (affects styling)
   */
  isMobileFooter?: boolean;
}

/**
 * Pro Request Form Component
 * Fixed sidebar form (desktop) or inline form (mobile footer)
 * Displays rate/hour and Contratar button
 */
export function ProRequestForm({
  hourlyRate,
  onContratar,
  disabled = false,
  isMobileFooter = false,
}: ProRequestFormProps) {
  const content = (
    <>
      {/* Rate/hour - Hidden on mobile footer, shown on desktop */}
      <div className="hidden md:block mb-6">
        <Text variant="h2" className="text-primary text-center">
          ${hourlyRate.toFixed(0)}/hora
        </Text>
      </div>

      {/* Mobile: Rate + Button in row */}
      <div className="flex md:hidden items-center justify-between gap-4">
        <div>
          <Text variant="body" className="text-muted text-xs">
            Tarifa
          </Text>
          <Text variant="h3" className="text-primary">
            ${hourlyRate.toFixed(0)}/hora
          </Text>
        </div>
        <Button
          variant="primary"
          onClick={onContratar}
          disabled={disabled}
          className="flex items-center justify-center gap-2 shrink-0"
        >
          <Calendar className="w-4 h-4" />
          Contratar
        </Button>
      </div>

      {/* Desktop: Button only */}
      <div className="hidden md:block">
        <Button
          variant="primary"
          onClick={onContratar}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Contratar
        </Button>
      </div>
    </>
  );

  // Wrap in Card for desktop sidebar, plain div for mobile footer
  if (isMobileFooter) {
    return <div className="flex flex-col md:block">{content}</div>;
  }

  return <Card className="p-4 md:p-6">{content}</Card>;
}
