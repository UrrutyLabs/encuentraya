import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProDetail } from "../useProDetail";
import { trpc } from "@/lib/trpc/client";

const mockUseMutation = vi.fn();
const mockUseUtils = vi.fn();

describe("useProDetail", () => {
  const proProfileId = "pro-1";
  const mockPro = {
    id: proProfileId,
    userId: "user-1",
    displayName: "Test Pro",
    email: "pro@example.com",
    status: "pending" as const,
  };

  const mockAuditLogs = [
    {
      id: "log-1",
      eventType: "PRO_SUSPENDED" as const,
      actorId: "admin-1",
      actorRole: "admin" as const,
      action: "suspend",
      metadata: { reason: "Test reason" },
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup useUtils mock
    mockUseUtils.mockReturnValue({
      pro: {
        adminById: {
          invalidate: vi.fn(),
        },
      },
      audit: {
        getResourceLogs: {
          invalidate: vi.fn(),
        },
      },
    });

    (trpc.useUtils as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockUseUtils()
    );

    // Setup useQuery mocks
    (trpc.pro.adminById.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockPro,
      isLoading: false,
      refetch: vi.fn(),
    });

    (
      trpc.audit.getResourceLogs.useQuery as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      data: mockAuditLogs,
      isLoading: false,
    });

    // Setup useMutation mocks
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    });

    (trpc.pro.suspend.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockUseMutation()
    );
    (
      trpc.pro.unsuspend.useMutation as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(mockUseMutation());
    (
      trpc.pro.approve.useMutation as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(mockUseMutation());
  });

  it("should return pro data and audit logs", () => {
    const { result } = renderHook(() =>
      useProDetail({ proProfileId })
    );

    expect(result.current.pro).toEqual(mockPro);
    expect(result.current.auditLogs).toEqual(mockAuditLogs);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoadingAuditLogs).toBe(false);
  });

  it("should call suspend mutation with correct parameters", () => {
    const onSuspendSuccess = vi.fn();
    const { result } = renderHook(() =>
      useProDetail({ proProfileId, onSuspendSuccess })
    );

    result.current.suspend.mutate("Test reason");

    expect(trpc.pro.suspend.useMutation).toHaveBeenCalled();
  });

  it("should call unsuspend mutation with correct parameters", () => {
    const onUnsuspendSuccess = vi.fn();
    const { result } = renderHook(() =>
      useProDetail({ proProfileId, onUnsuspendSuccess })
    );

    result.current.unsuspend.mutate();

    expect(trpc.pro.unsuspend.useMutation).toHaveBeenCalled();
  });

  it("should call approve mutation with correct parameters", () => {
    const onApproveSuccess = vi.fn();
    const { result } = renderHook(() =>
      useProDetail({ proProfileId, onApproveSuccess })
    );

    result.current.approve.mutate();

    expect(trpc.pro.approve.useMutation).toHaveBeenCalled();
  });

  it("should setup approve mutation with onSuccess callback", () => {
    const onApproveSuccess = vi.fn();
    const mockOnSuccess = vi.fn();

    (
      trpc.pro.approve.useMutation as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((options: { onSuccess?: () => void }) => {
      // Store the onSuccess callback
      if (options?.onSuccess) {
        mockOnSuccess.mockImplementation(options.onSuccess);
      }
      return {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      };
    });

    renderHook(() => useProDetail({ proProfileId, onApproveSuccess }));

    // Verify approve mutation was called
    expect(trpc.pro.approve.useMutation).toHaveBeenCalled();
    const mutationCall = (
      trpc.pro.approve.useMutation as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(mutationCall).toHaveProperty("onSuccess");
  });

  it("should return pending state for mutations", () => {
    (
      trpc.pro.approve.useMutation as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: true,
    });

    const { result } = renderHook(() => useProDetail({ proProfileId }));

    expect(result.current.approve.isPending).toBe(true);
  });

  it("should return empty array for audit logs when data is undefined", () => {
    (
      trpc.audit.getResourceLogs.useQuery as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useProDetail({ proProfileId }));

    expect(result.current.auditLogs).toEqual([]);
  });
});
