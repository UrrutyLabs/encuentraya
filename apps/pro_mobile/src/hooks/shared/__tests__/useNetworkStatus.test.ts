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

  it("should return isChecking true initially", () => {
    // Mock addEventListener to not call callback immediately
    const originalAddEventListener = mockNetInfo.addEventListener;
    (mockNetInfo.addEventListener as jest.Mock).mockImplementationOnce((callback) => {
      // Don't call callback immediately - simulate initial null state
      return () => {};
    });
    
    const { result } = renderHook(() => useNetworkStatus());

    // Initially should be checking (before state is set)
    expect(result.current.isChecking).toBe(true);
    
    // Restore original implementation
    mockNetInfo.addEventListener = originalAddEventListener;
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

  it("should clean up event listener on unmount", () => {
    const unsubscribeSpy = jest.fn();
    (mockNetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribeSpy);

    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it("should fetch initial state on mount", () => {
    renderHook(() => useNetworkStatus());

    expect(mockNetInfo.fetch).toHaveBeenCalled();
  });
});
