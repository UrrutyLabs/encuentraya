"use client";

import { Wallet } from "lucide-react";
import { Badge } from "@repo/ui";
import { Button } from "@repo/ui";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@repo/ui";
import { formatCurrency } from "@repo/domain";

interface PayablePro {
  proProfileId: string;
  displayName: string;
  totalPayable: number;
  currency: string;
  earningsCount: number;
  payoutProfileComplete: boolean;
}

interface PayablesTableProps {
  pros: PayablePro[];
  isLoading?: boolean;
  onCreatePayout: (proProfileId: string, displayName: string) => void;
}

export function PayablesTable({
  pros,
  isLoading,
  onCreatePayout,
}: PayablesTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={5} columns={5} />;
  }

  if (pros.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No hay profesionales con cobros pendientes"
        description="Todos los profesionales tienen sus cobros al día o no hay cobros pendientes."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profesional
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total a pagar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad de cobros
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Perfil completo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pros.map((pro) => (
              <tr key={pro.proProfileId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pro.displayName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(pro.totalPayable, pro.currency, true)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pro.earningsCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant={pro.payoutProfileComplete ? "success" : "warning"}
                  >
                    {pro.payoutProfileComplete ? "Completo" : "Incompleto"}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    variant="primary"
                    onClick={() =>
                      onCreatePayout(pro.proProfileId, pro.displayName)
                    }
                    disabled={!pro.payoutProfileComplete}
                  >
                    Crear payout
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
