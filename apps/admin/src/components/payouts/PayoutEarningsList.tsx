"use client";

import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { formatCurrency } from "@repo/domain";

interface Earning {
  earningId: string;
  bookingId: string;
  netAmount: number;
}

interface PayoutEarningsListProps {
  earnings: Earning[];
  currency: string;
}

export function PayoutEarningsList({
  earnings,
  currency,
}: PayoutEarningsListProps) {
  return (
    <Card className="p-6">
      <Text variant="h2" className="mb-4">
        Cobros incluidos
      </Text>
      {earnings.length === 0 ? (
        <Text variant="body" className="text-gray-600">
          No hay cobros registrados
        </Text>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Reserva
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Monto neto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {earnings.map((earning) => (
                <tr key={earning.earningId}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {earning.bookingId}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {formatCurrency(earning.netAmount, currency, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
