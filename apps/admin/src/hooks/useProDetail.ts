import { trpc } from "@/lib/trpc/client";

interface UseProDetailProps {
  proProfileId: string;
  onSuspendSuccess?: () => void;
  onUnsuspendSuccess?: () => void;
}

export function useProDetail({
  proProfileId,
  onSuspendSuccess,
  onUnsuspendSuccess,
}: UseProDetailProps) {
  const utils = trpc.useUtils();

  const { data: pro, isLoading, refetch } = trpc.pro.adminById.useQuery({
    proProfileId,
  });

  // Fetch all audit logs for this pro profile
  const { data: auditLogs, isLoading: isLoadingAuditLogs } =
    trpc.audit.getResourceLogs.useQuery({
      resourceType: "pro",
      resourceId: proProfileId,
    });

  // Helper to invalidate audit logs (type assertion needed due to 'client' router name collision)
  const invalidateAuditLogs = () => {
    const auditUtils = (utils as unknown as {
      audit: { getResourceLogs: { invalidate: (input: { resourceType: string; resourceId: string }) => void } };
    }).audit;
    void auditUtils.getResourceLogs.invalidate({
      resourceType: "pro",
      resourceId: proProfileId,
    });
  };

  const suspendMutation = trpc.pro.suspend.useMutation({
    onSuccess: () => {
      refetch();
      invalidateAuditLogs();
      onSuspendSuccess?.();
    },
  });

  const unsuspendMutation = trpc.pro.unsuspend.useMutation({
    onSuccess: () => {
      refetch();
      invalidateAuditLogs();
      onUnsuspendSuccess?.();
    },
  });

  const handleSuspend = (reason?: string) => {
    suspendMutation.mutate({
      proProfileId,
      reason: reason || undefined,
    });
  };

  const handleUnsuspend = () => {
    unsuspendMutation.mutate({ proProfileId });
  };

  return {
    pro,
    isLoading,
    auditLogs: auditLogs || [],
    isLoadingAuditLogs,
    suspend: {
      mutate: handleSuspend,
      isPending: suspendMutation.isPending,
    },
    unsuspend: {
      mutate: handleUnsuspend,
      isPending: unsuspendMutation.isPending,
    },
  };
}
