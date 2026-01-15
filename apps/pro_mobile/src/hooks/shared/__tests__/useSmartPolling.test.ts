import { renderHook } from "@testing-library/react-native";
import { useSmartPolling, type SmartPollingOptions } from "../useSmartPolling";
import { useAppState } from "../useAppState";

jest.mock("../useAppState");

describe("useSmartPolling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppState as jest.Mock).mockReturnValue(true);
  });

  it("should return polling options when app is in foreground and enabled", () => {
    (useAppState as jest.Mock).mockReturnValue(true);
    const { result } = renderHook(() =>
      useSmartPolling({
        interval: 5000,
        enabled: true,
        refetchOnForeground: true,
      })
    );

    expect(result.current.refetchInterval).toBe(5000);
    expect(result.current.refetchOnWindowFocus).toBe(true);
    expect(result.current.refetchOnMount).toBe(true);
  });

  it("should return false for refetchInterval when app is in background", () => {
    (useAppState as jest.Mock).mockReturnValue(false);
    const { result } = renderHook(() =>
      useSmartPolling({
        interval: 5000,
        enabled: true,
        refetchOnForeground: true,
      })
    );

    expect(result.current.refetchInterval).toBe(false);
    expect(result.current.refetchOnWindowFocus).toBe(true);
    expect(result.current.refetchOnMount).toBe(true);
  });

  it("should return false for refetchInterval when disabled", () => {
    (useAppState as jest.Mock).mockReturnValue(true);
    const { result } = renderHook(() =>
      useSmartPolling({
        interval: 5000,
        enabled: false,
        refetchOnForeground: true,
      })
    );

    expect(result.current.refetchInterval).toBe(false);
    expect(result.current.refetchOnWindowFocus).toBe(false);
    expect(result.current.refetchOnMount).toBe(false);
  });

  it("should use default enabled value of true", () => {
    (useAppState as jest.Mock).mockReturnValue(true);
    const { result } = renderHook(() =>
      useSmartPolling({
        interval: 10000,
      })
    );

    expect(result.current.refetchInterval).toBe(10000);
    expect(result.current.refetchOnWindowFocus).toBe(true);
    expect(result.current.refetchOnMount).toBe(true);
  });

  it("should use default refetchOnForeground value of true", () => {
    (useAppState as jest.Mock).mockReturnValue(true);
    const { result } = renderHook(() =>
      useSmartPolling({
        interval: 5000,
        enabled: true,
      })
    );

    expect(result.current.refetchOnWindowFocus).toBe(true);
    expect(result.current.refetchOnMount).toBe(true);
  });

  it("should disable refetchOnForeground when set to false", () => {
    (useAppState as jest.Mock).mockReturnValue(true);
    const { result } = renderHook(() =>
      useSmartPolling({
        interval: 5000,
        enabled: true,
        refetchOnForeground: false,
      })
    );

    expect(result.current.refetchInterval).toBe(5000);
    expect(result.current.refetchOnWindowFocus).toBe(false);
    expect(result.current.refetchOnMount).toBe(false);
  });

  it("should update when app state changes from background to foreground", () => {
    (useAppState as jest.Mock).mockReturnValue(false);
    const { result, rerender } = renderHook(
      (props: SmartPollingOptions) =>
        useSmartPolling({
          interval: props.interval,
          enabled: props.enabled,
        }),
      {
        initialProps: { interval: 5000, enabled: true },
      }
    );

    expect(result.current.refetchInterval).toBe(false);

    (useAppState as jest.Mock).mockReturnValue(true);
    rerender({ interval: 5000, enabled: true });

    expect(result.current.refetchInterval).toBe(5000);
  });

  it("should update when app state changes from foreground to background", () => {
    (useAppState as jest.Mock).mockReturnValue(true);
    const { result, rerender } = renderHook(
      (props: SmartPollingOptions) =>
        useSmartPolling({
          interval: props.interval,
          enabled: props.enabled,
        }),
      {
        initialProps: { interval: 5000, enabled: true },
      }
    );

    expect(result.current.refetchInterval).toBe(5000);

    (useAppState as jest.Mock).mockReturnValue(false);
    rerender({ interval: 5000, enabled: true });

    expect(result.current.refetchInterval).toBe(false);
  });

  it("should memoize result based on dependencies", () => {
    (useAppState as jest.Mock).mockReturnValue(true);
    const { result, rerender } = renderHook(
      ({ interval, enabled }: SmartPollingOptions) =>
        useSmartPolling({
          interval,
          enabled,
        }),
      {
        initialProps: { interval: 5000, enabled: true },
      }
    );

    const firstResult = result.current;

    // Rerender with same props
    rerender({ interval: 5000, enabled: true });

    // Should return same reference if dependencies haven't changed
    expect(result.current).toBe(firstResult);

    // Change interval
    rerender({ interval: 10000, enabled: true });

    // Should return new reference
    expect(result.current).not.toBe(firstResult);
    expect(result.current.refetchInterval).toBe(10000);
  });
});
