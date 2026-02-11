// Suppress react-test-renderer deprecation warning
// This is a known issue with @testing-library/react-native and React 19
// The library still uses react-test-renderer internally
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("react-test-renderer is deprecated")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock React Native JS polyfills before any other imports
jest.mock("@react-native/js-polyfills/error-guard", () => ({}), {
  virtual: true,
});

// Mock React Native modules
jest.mock("react-native", () => {
  const callbacks = [];

  return {
    AppState: {
      currentState: "active",
      addEventListener: jest.fn((event, callback) => {
        callbacks.push(callback);
        return {
          remove: jest.fn(() => {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
              callbacks.splice(index, 1);
            }
          }),
        };
      }),
      _callbacks: callbacks,
      _triggerChange: (state) => {
        callbacks.forEach((cb) => cb(state));
      },
    },
  };
});

// Mock NetInfo
jest.mock("@react-native-community/netinfo", () => {
  let currentState = { isConnected: true, isInternetReachable: true };
  const listeners = [];

  const mockNetInfo = {
    fetch: jest.fn(() => Promise.resolve(currentState)),
    addEventListener: jest.fn((callback) => {
      listeners.push(callback);
      callback(currentState);
      return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    }),
    _setState: (state) => {
      currentState = state;
      listeners.forEach((cb) => cb(state));
    },
  };

  return {
    __esModule: true,
    default: mockNetInfo,
  };
});

// Mock Expo modules
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: "mock-token" })),
}));

// Mock logger
jest.mock("@lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock tRPC client
jest.mock("@lib/trpc/client", () => ({
  trpc: {
    push: {
      registerToken: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn(),
          isPending: false,
        })),
      },
      unregisterToken: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn(),
          isPending: false,
        })),
      },
    },
  },
}));

// Mock QueryClient
jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
      cancelQueries: jest.fn(),
    })),
  };
});

// Mock getQueryClient
jest.mock("@lib/trpc/Provider", () => ({
  getQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    cancelQueries: jest.fn(),
    clear: jest.fn(),
  })),
  getQueryClientIfAvailable: jest.fn(() => ({
    clear: jest.fn(),
  })),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Redirect: () => null,
  Stack: () => null,
}));

// Mock Supabase client
jest.mock("@lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resend: jest.fn(),
    },
  },
}));
