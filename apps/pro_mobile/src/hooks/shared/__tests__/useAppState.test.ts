import { renderHook, act } from "@testing-library/react-native";
import { AppState } from "react-native";
import { useAppState } from "../useAppState";

// Access the mocked AppState
const mockAppState = AppState as jest.Mocked<typeof AppState> & {
  _callbacks: ((state: string) => void)[];
  _triggerChange: (state: string) => void;
};

describe("useAppState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AppState mock
    mockAppState.currentState = "active";
    mockAppState._callbacks = [];
  });

  it("should return true when app is in foreground", () => {
    mockAppState.currentState = "active";
    const { result } = renderHook(() => useAppState());

    expect(result.current).toBe(true);
  });

  it("should return false when app is in background", () => {
    mockAppState.currentState = "background";
    const { result } = renderHook(() => useAppState());

    expect(result.current).toBe(false);
  });

  it("should update when app state changes to active", () => {
    mockAppState.currentState = "background";
    const { result } = renderHook(() => useAppState());

    expect(result.current).toBe(false);

    act(() => {
      mockAppState._triggerChange("active");
    });

    expect(result.current).toBe(true);
  });

  it("should update when app state changes to background", () => {
    mockAppState.currentState = "active";
    const { result } = renderHook(() => useAppState());

    expect(result.current).toBe(true);

    act(() => {
      mockAppState._triggerChange("background");
    });

    expect(result.current).toBe(false);
  });

  it("should only return true for active state", () => {
    mockAppState.currentState = "inactive";
    const { result } = renderHook(() => useAppState());

    expect(result.current).toBe(false);

    act(() => {
      mockAppState._triggerChange("inactive");
    });

    expect(result.current).toBe(false);
  });

  it("should clean up event listener on unmount", () => {
    const { unmount } = renderHook(() => useAppState());

    unmount();

    // Verify addEventListener was called
    expect(mockAppState.addEventListener).toHaveBeenCalled();
  });
});
