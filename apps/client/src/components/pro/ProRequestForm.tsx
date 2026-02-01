import { Calendar } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import type { StartingPriceForCategory } from "@repo/domain";

interface ProRequestFormProps {
  /** Fallback when no category context (e.g. legacy) */
  hourlyRate: number;
  /** When pro.getById was called with categoryId; used for "$X/hora" (hourly) or "Desde $X" (fixed) */
  startingPriceForCategory?: StartingPriceForCategory | null;
  proId: string;
  onContratar: () => void;
  disabled?: boolean;
  /**
   * Whether this is displayed in a mobile footer (affects styling)
   */
  isMobileFooter?: boolean;
}

function formatPriceLabel(
  startingPriceForCategory: StartingPriceForCategory | null | undefined,
  hourlyRate: number
): string {
  if (!startingPriceForCategory) {
    return `$${hourlyRate.toFixed(0)}/hora`;
  }
  const { pricingMode, hourlyRateCents, startingFromCents } =
    startingPriceForCategory;
  if (pricingMode === "fixed" && startingFromCents != null) {
    return `Desde $${(startingFromCents / 100).toFixed(0)}`;
  }
  if (hourlyRateCents != null) {
    return `$${(hourlyRateCents / 100).toFixed(0)}/hora`;
  }
  return `$${hourlyRate.toFixed(0)}/hora`;
}

/**
 * Pro Request Form Component
 * Fixed sidebar form (desktop) or inline form (mobile footer)
 * Displays starting price (by category) and Contratar button. Only shown when category context is set.
 */
export function ProRequestForm({
  hourlyRate,
  startingPriceForCategory,
  onContratar,
  disabled = false,
  isMobileFooter = false,
}: ProRequestFormProps) {
  const priceLabel = formatPriceLabel(startingPriceForCategory, hourlyRate);

  const content = (
    <>
      {/* Rate - Hidden on mobile footer, shown on desktop */}
      <div className="hidden md:block mb-6">
        <Text variant="h2" className="text-primary text-center">
          {priceLabel}
        </Text>
      </div>

      {/* Mobile: Rate + Button in row */}
      <div className="flex md:hidden items-center justify-between gap-4">
        <div>
          <Text variant="body" className="text-muted text-xs">
            Tarifa
          </Text>
          <Text variant="h3" className="text-primary">
            {priceLabel}
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
