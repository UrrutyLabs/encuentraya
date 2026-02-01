import {
  toMajorUnits,
  type Order,
  type OrderEstimateOutput,
} from "@repo/domain";

/** Build cost estimation from order for display (line items + subtotal/tax/total). */
export function orderToCostEstimation(job: Order): OrderEstimateOutput | null {
  const {
    subtotalAmount,
    platformFeeAmount,
    taxAmount,
    totalAmount,
    taxRate,
    currency,
    hourlyRateSnapshotAmount,
    estimatedHours,
  } = job;
  if (
    subtotalAmount == null ||
    platformFeeAmount == null ||
    taxAmount == null ||
    totalAmount == null
  ) {
    return null;
  }
  const laborAmount = subtotalAmount - platformFeeAmount;
  const rate = taxRate ?? 0.22;
  const platformFeeRate = 0.1;
  const lineItems = [
    {
      type: "labor",
      description: `Labor (${estimatedHours} horas × ${toMajorUnits(hourlyRateSnapshotAmount).toFixed(0)} ${currency}/hora)`,
      amount: laborAmount,
    },
    {
      type: "platform_fee",
      description: `Tarifa de plataforma (${(platformFeeRate * 100).toFixed(0)}%)`,
      amount: platformFeeAmount,
    },
    {
      type: "tax",
      description: `IVA (${(rate * 100).toFixed(0)}%)`,
      amount: taxAmount,
    },
  ];
  return {
    laborAmount,
    platformFeeAmount,
    platformFeeRate,
    taxAmount,
    taxRate: rate,
    subtotalAmount,
    totalAmount,
    currency,
    lineItems,
  };
}
