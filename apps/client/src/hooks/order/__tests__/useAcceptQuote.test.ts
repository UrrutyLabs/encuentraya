import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAcceptQuote } from "../useAcceptQuote";
import { mockTrpcOrderAcceptQuote } from "@/test-setup";

describe("useAcceptQuote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls order.acceptQuote with orderId when acceptQuote is invoked", async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

    mockTrpcOrderAcceptQuote.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useAcceptQuote("order-1"));

    await act(async () => {
      await result.current.acceptQuote();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ orderId: "order-1" });
  });

  it("does not call mutation when orderId is undefined", async () => {
    const mockMutateAsync = vi.fn();

    mockTrpcOrderAcceptQuote.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useAcceptQuote(undefined));

    await act(async () => {
      await result.current.acceptQuote();
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
