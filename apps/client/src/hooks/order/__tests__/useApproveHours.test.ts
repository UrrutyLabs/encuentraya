import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useApproveHours } from "../useApproveHours";
import { mockTrpcOrderApproveHours } from "@/test-setup";

describe("useApproveHours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls order.approveHours with orderId when approveHours is invoked", async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

    mockTrpcOrderApproveHours.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useApproveHours("order-1"));

    await act(async () => {
      await result.current.approveHours();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ orderId: "order-1" });
  });

  it("does not call mutation when orderId is undefined", async () => {
    const mockMutateAsync = vi.fn();

    mockTrpcOrderApproveHours.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useApproveHours(undefined));

    await act(async () => {
      await result.current.approveHours();
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
