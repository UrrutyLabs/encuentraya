"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { useMemo } from "react";
import { ProAuditHistory } from "@/components/pros/ProAuditHistory";
import { ProDetailSkeleton } from "@/components/presentational/ProDetailSkeleton";
import { useProDetail } from "@/hooks/useProDetail";
import { useCategories } from "@/hooks/useCategories";

interface ProDetailScreenProps {
  proProfileId: string;
}

export function ProDetailScreen({ proProfileId }: ProDetailScreenProps) {
  const router = useRouter();
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const {
    pro,
    isLoading,
    auditLogs,
    isLoadingAuditLogs,
    suspend,
    unsuspend,
    approve,
  } = useProDetail({
    proProfileId,
    onSuspendSuccess: () => {
      setShowSuspendModal(false);
      setSuspendReason("");
    },
    onUnsuspendSuccess: () => {
      setShowUnsuspendModal(false);
    },
    onApproveSuccess: () => {
      setShowApproveModal(false);
    },
  });

  // Fetch categories to display names
  const { data: categories } = useCategories();

  // Create category map for lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; isDeleted: boolean }>();
    categories?.forEach((category) => {
      map.set(category.id, {
        name: category.name,
        isDeleted: !!category.deletedAt || !category.isActive,
      });
    });
    return map;
  }, [categories]);

  // Get category names for display
  const categoryNames = useMemo(() => {
    if (!pro?.categoryIds || !categories) return [];
    return pro.categoryIds
      .map((categoryId) => {
        const category = categoryMap.get(categoryId);
        if (!category) return null;
        return category.isDeleted
          ? `${category.name} (eliminada)`
          : category.name;
      })
      .filter((name): name is string => name !== null);
  }, [pro, categories, categoryMap]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (
    status: "pending" | "active" | "suspended"
  ): "info" | "success" | "warning" | "danger" => {
    const statusMap: Record<
      "pending" | "active" | "suspended",
      "info" | "success" | "warning" | "danger"
    > = {
      pending: "warning",
      active: "success",
      suspended: "danger",
    };
    return statusMap[status] || "info";
  };

  const getStatusLabel = (status: "pending" | "active" | "suspended") => {
    const labels: Record<"pending" | "active" | "suspended", string> = {
      pending: "Pendiente",
      active: "Activo",
      suspended: "Suspendido",
    };
    return labels[status] || status;
  };

  const handleSuspend = () => {
    setShowSuspendModal(true);
  };

  const handleUnsuspend = () => {
    setShowUnsuspendModal(true);
  };

  const handleApprove = () => {
    setShowApproveModal(true);
  };

  const confirmSuspend = () => {
    suspend.mutate(suspendReason || undefined);
  };

  const confirmUnsuspend = () => {
    unsuspend.mutate();
  };

  const confirmApprove = () => {
    approve.mutate();
  };

  if (isLoading) {
    return <ProDetailSkeleton />;
  }

  if (!pro) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Profesional no encontrado</Text>
      </div>
    );
  }

  const canSuspend = pro.status !== "suspended";
  const canUnsuspend = pro.status === "suspended";
  const canApprove = pro.status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h1">{pro.displayName}</Text>
          <Badge variant={getStatusBadgeVariant(pro.status)} className="mt-2">
            {getStatusLabel(pro.status)}
          </Badge>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* Pro Summary */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Información del Profesional
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="small" className="text-gray-600">
              ID de Perfil
            </Text>
            <Text variant="body">{pro.id}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              ID de Usuario
            </Text>
            <Text variant="body">{pro.userId}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Email
            </Text>
            <Text variant="body">{pro.email}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Teléfono
            </Text>
            <Text variant="body">{pro.phone || "-"}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Tarifa por Hora
            </Text>
            <Text variant="body">{pro.hourlyRate}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Área de Servicio
            </Text>
            <Text variant="body">{pro.serviceArea || "-"}</Text>
          </div>
          <div className="md:col-span-2">
            <Text variant="small" className="text-gray-600">
              Categorías
            </Text>
            {categoryNames.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {categoryNames.map((categoryName, index) => (
                  <Badge key={index} variant="info" showIcon>
                    {categoryName}
                  </Badge>
                ))}
              </div>
            ) : (
              <Text variant="body">—</Text>
            )}
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Creado
            </Text>
            <Text variant="body">{formatDate(pro.createdAt)}</Text>
          </div>
          {pro.bio && (
            <div className="md:col-span-2">
              <Text variant="small" className="text-gray-600">
                Biografía
              </Text>
              <Text variant="body">{pro.bio}</Text>
            </div>
          )}
        </div>
      </Card>

      {/* Payout Profile */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Perfil de Pago
        </Text>
        {pro.payoutProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text variant="small" className="text-gray-600">
                Método de Pago
              </Text>
              <Text variant="body">{pro.payoutProfile.payoutMethod}</Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Estado
              </Text>
              {pro.payoutProfile.isComplete ? (
                <Badge variant="success">Completo</Badge>
              ) : (
                <Badge variant="warning">Incompleto</Badge>
              )}
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Nombre Completo
              </Text>
              <Text variant="body">{pro.payoutProfile.fullName || "-"}</Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Documento
              </Text>
              <Text variant="body">{pro.payoutProfile.documentId || "-"}</Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Banco
              </Text>
              <Text variant="body">{pro.payoutProfile.bankName || "-"}</Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Tipo de Cuenta
              </Text>
              <Text variant="body">
                {pro.payoutProfile.bankAccountType || "-"}
              </Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Número de Cuenta
              </Text>
              <Text variant="body">
                {pro.payoutProfile.bankAccountNumber || "-"}
              </Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">
                Moneda
              </Text>
              <Text variant="body">{pro.payoutProfile.currency}</Text>
            </div>
          </div>
        ) : (
          <Text variant="body" className="text-gray-600">
            No hay perfil de pago configurado.
          </Text>
        )}
      </Card>

      {/* Audit History */}
      <ProAuditHistory
        logs={auditLogs.map((log) => ({
          ...log,
          eventType: log.eventType as
            | "PRO_SUSPENDED"
            | "PRO_UNSUSPENDED"
            | "PRO_APPROVED"
            | "ORDER_STATUS_FORCED"
            | "PAYMENT_SYNCED"
            | "PAYOUT_CREATED"
            | "PAYOUT_SENT"
            | "USER_ROLE_CHANGED",
          actorRole: log.actorRole as string,
        }))}
        isLoading={isLoadingAuditLogs}
      />

      {/* Actions */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Acciones
        </Text>
        <div className="flex gap-2">
          {canApprove && (
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={approve.isPending}
            >
              Aprobar
            </Button>
          )}
          {canSuspend && (
            <Button
              variant="danger"
              onClick={handleSuspend}
              disabled={suspend.isPending}
            >
              Suspender
            </Button>
          )}
          {canUnsuspend && (
            <Button
              variant="primary"
              onClick={handleUnsuspend}
              disabled={unsuspend.isPending}
            >
              Reactivar
            </Button>
          )}
        </div>
      </Card>

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4">
            <Text variant="h2" className="mb-4">
              Confirmar Suspensión
            </Text>
            <Text variant="body" className="mb-4">
              ¿Estás seguro de que querés suspender a este profesional?
            </Text>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón (opcional)
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Ingresar razón de suspensión..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="danger"
                onClick={confirmSuspend}
                disabled={suspend.isPending}
                className="flex-1"
              >
                {suspend.isPending ? "Suspendiendo..." : "Confirmar"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Unsuspend Confirmation Modal */}
      {showUnsuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4">
            <Text variant="h2" className="mb-4">
              Confirmar Reactivación
            </Text>
            <Text variant="body" className="mb-4">
              ¿Estás seguro de que querés reactivar a este profesional?
            </Text>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={confirmUnsuspend}
                disabled={unsuspend.isPending}
                className="flex-1"
              >
                {unsuspend.isPending ? "Reactivando..." : "Confirmar"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowUnsuspendModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4">
            <Text variant="h2" className="mb-4">
              Confirmar Aprobación
            </Text>
            <Text variant="body" className="mb-4">
              ¿Estás seguro de que querés aprobar a este profesional? Una vez
              aprobado, podrá recibir solicitudes de clientes.
            </Text>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={confirmApprove}
                disabled={approve.isPending}
                className="flex-1"
              >
                {approve.isPending ? "Aprobando..." : "Confirmar"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowApproveModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
