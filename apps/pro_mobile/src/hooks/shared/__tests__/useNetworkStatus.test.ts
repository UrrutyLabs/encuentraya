import { renderHook, act, waitFor } from "@testing-library/react-native";
import NetInfo from "@react-native-community/netinfo";
import { useNetworkStatus } from "../useNetworkStatus";

// Access the mocked NetInfo
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo> & {
  _setState: (state: { isConnected: boolean | null; isInternetReachable?: boolean }) => void;
};

describe("useNetworkStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset NetInfo mock state
    mockNetInfo._setState({ isConnected: true, isInternetReachable: true });
  });

  it("should return isOnline true when connected", async () => {
    mockNetInfo._setState({ isConnected: true, isInternetReachable: true });
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.isChecking).toBe(false);
    });
  });

  it("should return isOffline true when disconnected", async () => {
    mockNetInfo._setState({ isConnected: false, isInternetReachable: false });
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
      expect(result.current.isChecking).toBe(false);
    });
  });

  it("should return isChecking true initially", async () => {
    // Mock both addEventListener and fetch to delay callbacks
    const originalAddEventListener = mockNetInfo.addEventListener;
    const originalFetch = mockNetInfo.fetch;
    
    // Prevent addEventListener from calling callback immediately
    (mockNetInfo.addEventListener as jest.Mock).mockImplementationOnce((callback) => {
      // Don't call callback immediately
      return () => {};
    });
    
    // Mock fetch to delay resolution
    let resolveFetch: ((value: any) => void) | undefined;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    (mockNetInfo.fetch as jest.Mock).mockImplementationOnce(() => fetchPromise);
    
    const { result } = renderHook(() => useNetworkStatus());

    // Initially should be checking (before state is set)
    expect(result.current.isChecking).toBe(true);
    
    // Resolve the fetch promise and wait for state update
    await act(async () => {
      resolveFetch!({ isConnected: true, isInternetReachable: true } as any);
      // Wait a tick for state to update
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    
    // Wait for async operations to complete to avoid act() warnings
    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });
    
    // Restore original implementations
    mockNetInfo.addEventListener = originalAddEventListener;
    mockNetInfo.fetch = originalFetch;
  });

  it("should update when network state changes to online", async () => {
    mockNetInfo._setState({ isConnected: false });
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    });

    act(() => {
      mockNetInfo._setState({ isConnected: true, isInternetReachable: true });
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });
  });

  it("should update when network state changes to offline", async () => {
    mockNetInfo._setState({ isConnected: true });
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });

    act(() => {
      mockNetInfo._setState({ isConnected: false, isInternetReachable: false });
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });
  });

  it("should default to online if state is unknown", async () => {
    mockNetInfo._setState({ isConnected: null });
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      // Should default to online if unknown
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });
  });

  it("should clean up event listener on unmount", async () => {
    const unsubscribeSpy = jest.fn();
    (mockNetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribeSpy);

    const { unmount } = renderHook(() => useNetworkStatus());

    // Wait for async operations to complete before unmounting
    await waitFor(() => {
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });

    await act(async () => {
      unmount();
    });

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it("should fetch initial state on mount", async () => {
    renderHook(() => useNetworkStatus());

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });
  });
});
