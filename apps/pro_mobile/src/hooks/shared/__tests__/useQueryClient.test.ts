import { renderHook } from "@testing-library/react-native";
import { useQueryClient as useRQQueryClient } from "@tanstack/react-query";
import { getQueryClient } from "@lib/trpc/Provider";
import { useQueryClient } from "../useQueryClient";

jest.mock("@tanstack/react-query");
jest.mock("@lib/trpc/Provider");

const mockQueryClient = {
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
  cancelQueries: jest.fn(),
};

describe("useQueryClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return React Query client when hook is available", () => {
    (useRQQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    const { result } = renderHook(() => useQueryClient());

    expect(result.current).toBe(mockQueryClient);
    expect(useRQQueryClient).toHaveBeenCalled();
    expect(getQueryClient).not.toHaveBeenCalled();
  });

  it("should fallback to getQueryClient when hook throws error", () => {
    (useRQQueryClient as jest.Mock).mockImplementation(() => {
      throw new Error("Not in provider");
    });
    (getQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    const { result } = renderHook(() => useQueryClient());

    expect(result.current).toBe(mockQueryClient);
    expect(useRQQueryClient).toHaveBeenCalled();
    expect(getQueryClient).toHaveBeenCalled();
  });

  it("should return same client instance on multiple calls", () => {
    (useRQQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    const { result: result1 } = renderHook(() => useQueryClient());
    const { result: result2 } = renderHook(() => useQueryClient());

    expect(result1.current).toBe(mockQueryClient);
    expect(result2.current).toBe(mockQueryClient);
  });
});
