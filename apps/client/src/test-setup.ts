import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock window.matchMedia for useMediaQuery hook
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => {
    return {
      matches: false, // Default to desktop (non-mobile)
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }),
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock tRPC client - create a mock that can be used in tests
const mockTrpcProGetById = vi.fn();
const mockTrpcClientSearchPros = vi.fn();
const mockTrpcClientProfileGet = vi.fn();
const mockTrpcClientProfileUpdate = vi.fn();
// Category mocks
const mockTrpcCategoryGetAll = vi.fn();
const mockTrpcCategoryGetById = vi.fn();
const mockTrpcCategoryGetBySlug = vi.fn();
const mockTrpcCategoryGetByKey = vi.fn();
// Subcategory mocks
const mockTrpcSubcategoryGetByCategoryId = vi.fn();
const mockTrpcSubcategoryGetBySlugAndCategoryId = vi.fn();
const mockTrpcAuthSignup = vi.fn();
const mockTrpcAuthChangePassword = vi.fn();
const mockTrpcAuthDeleteAccount = vi.fn();
const mockTrpcBookingMyBookings = vi.fn();
const mockTrpcBookingGetById = vi.fn();
const mockTrpcBookingCreate = vi.fn();
const mockTrpcBookingCancel = vi.fn();
const mockTrpcBookingRebookTemplate = vi.fn();
const mockTrpcReviewStatusByBookingIds = vi.fn();
const mockTrpcReviewByBooking = vi.fn();
const mockTrpcReviewCreate = vi.fn();
const mockTrpcPaymentGetByBooking = vi.fn();
const mockTrpcPaymentCreatePreauthForBooking = vi.fn();
// Order mocks
const mockTrpcOrderListByClient = vi.fn();
const mockTrpcOrderGetById = vi.fn();
const mockTrpcOrderCreate = vi.fn();
const mockTrpcOrderCancel = vi.fn();
const mockTrpcOrderAcceptQuote = vi.fn();
const mockTrpcOrderApproveHours = vi.fn();
const mockTrpcReviewStatusByOrderIds = vi.fn();
const mockTrpcReviewByOrder = vi.fn();
const mockTrpcPaymentGetByOrder = vi.fn();
const mockTrpcPaymentCreatePreauthForOrder = vi.fn();
const mockTrpcContactSubmit = vi.fn();
const mockTrpcUploadGetPresignedUploadUrl = vi.fn();
const mockTrpcSubcategoryGetByCategory = vi.fn();
const mockTrpcSubcategoryGetBySlug = vi.fn();
const mockTrpcSubcategoryGetById = vi.fn();
const mockTrpcSubcategoryGetAll = vi.fn();

vi.mock("@/lib/trpc/client", () => {
  return {
    trpc: {
      pro: {
        getById: {
          useQuery: (...args: unknown[]) => mockTrpcProGetById(...args),
        },
      },
      clientSearch: {
        searchPros: {
          useQuery: (...args: unknown[]) => mockTrpcClientSearchPros(...args),
        },
      },
      category: {
        getAll: {
          useQuery: (...args: unknown[]) => mockTrpcCategoryGetAll(...args),
        },
        getById: {
          useQuery: (...args: unknown[]) => mockTrpcCategoryGetById(...args),
        },
        getBySlug: {
          useQuery: (...args: unknown[]) => mockTrpcCategoryGetBySlug(...args),
        },
        getByKey: {
          useQuery: (...args: unknown[]) => mockTrpcCategoryGetByKey(...args),
        },
      },
      subcategory: {
        getByCategoryId: {
          useQuery: (...args: unknown[]) =>
            mockTrpcSubcategoryGetByCategoryId(...args),
        },
        getBySlugAndCategoryId: {
          useQuery: (...args: unknown[]) =>
            mockTrpcSubcategoryGetBySlugAndCategoryId(...args),
        },
        getByCategory: {
          useQuery: (...args: unknown[]) =>
            mockTrpcSubcategoryGetByCategory(...args),
        },
        getBySlug: {
          useQuery: (...args: unknown[]) =>
            mockTrpcSubcategoryGetBySlug(...args),
        },
        getById: {
          useQuery: (...args: unknown[]) => mockTrpcSubcategoryGetById(...args),
        },
        getAll: {
          useQuery: (...args: unknown[]) => mockTrpcSubcategoryGetAll(...args),
        },
      },
      clientProfile: {
        get: {
          useQuery: (...args: unknown[]) => mockTrpcClientProfileGet(...args),
        },
        update: {
          useMutation: (...args: unknown[]) =>
            mockTrpcClientProfileUpdate(...args),
        },
      },
      auth: {
        signup: {
          useMutation: (...args: unknown[]) => mockTrpcAuthSignup(...args),
        },
        changePassword: {
          useMutation: (...args: unknown[]) =>
            mockTrpcAuthChangePassword(...args),
        },
        deleteAccount: {
          useMutation: (...args: unknown[]) =>
            mockTrpcAuthDeleteAccount(...args),
        },
      },
      booking: {
        myBookings: {
          useQuery: (...args: unknown[]) => mockTrpcBookingMyBookings(...args),
        },
        getById: {
          useQuery: (...args: unknown[]) => mockTrpcBookingGetById(...args),
        },
        create: {
          useMutation: (...args: unknown[]) => mockTrpcBookingCreate(...args),
        },
        cancel: {
          useMutation: (...args: unknown[]) => mockTrpcBookingCancel(...args),
        },
        rebookTemplate: {
          useQuery: (...args: unknown[]) =>
            mockTrpcBookingRebookTemplate(...args),
        },
      },
      review: {
        statusByBookingIds: {
          useQuery: (...args: unknown[]) =>
            mockTrpcReviewStatusByBookingIds(...args),
        },
        byBooking: {
          useQuery: (...args: unknown[]) => mockTrpcReviewByBooking(...args),
        },
        statusByOrderIds: {
          useQuery: (...args: unknown[]) =>
            mockTrpcReviewStatusByOrderIds(...args),
        },
        byOrder: {
          useQuery: (...args: unknown[]) => mockTrpcReviewByOrder(...args),
        },
        create: {
          useMutation: (...args: unknown[]) => mockTrpcReviewCreate(...args),
        },
      },
      payment: {
        getByBooking: {
          useQuery: (...args: unknown[]) =>
            mockTrpcPaymentGetByBooking(...args),
        },
        createPreauthForBooking: {
          useMutation: (...args: unknown[]) =>
            mockTrpcPaymentCreatePreauthForBooking(...args),
        },
        getByOrder: {
          useQuery: (...args: unknown[]) => mockTrpcPaymentGetByOrder(...args),
        },
        createPreauthForOrder: {
          useMutation: (...args: unknown[]) =>
            mockTrpcPaymentCreatePreauthForOrder(...args),
        },
      },
      order: {
        listByClient: {
          useQuery: (...args: unknown[]) => mockTrpcOrderListByClient(...args),
        },
        getById: {
          useQuery: (...args: unknown[]) => mockTrpcOrderGetById(...args),
        },
        create: {
          useMutation: (...args: unknown[]) => mockTrpcOrderCreate(...args),
        },
        cancel: {
          useMutation: (...args: unknown[]) => mockTrpcOrderCancel(...args),
        },
        acceptQuote: {
          useMutation: (...args: unknown[]) =>
            mockTrpcOrderAcceptQuote(...args),
        },
        approveHours: {
          useMutation: (...args: unknown[]) =>
            mockTrpcOrderApproveHours(...args),
        },
      },
      contact: {
        submit: {
          useMutation: (...args: unknown[]) => mockTrpcContactSubmit(...args),
        },
      },
      upload: {
        getPresignedUploadUrl: {
          useMutation: (...args: unknown[]) =>
            mockTrpcUploadGetPresignedUploadUrl(...args),
        },
      },
    },
  };
});

// Export mocks for use in tests
export {
  mockTrpcProGetById,
  mockTrpcClientSearchPros,
  mockTrpcClientProfileGet,
  mockTrpcClientProfileUpdate,
  mockTrpcAuthSignup,
  mockTrpcAuthChangePassword,
  mockTrpcAuthDeleteAccount,
  mockTrpcBookingMyBookings,
  mockTrpcBookingGetById,
  mockTrpcBookingCreate,
  mockTrpcBookingCancel,
  mockTrpcBookingRebookTemplate,
  mockTrpcReviewStatusByBookingIds,
  mockTrpcReviewByBooking,
  mockTrpcReviewCreate,
  mockTrpcPaymentGetByBooking,
  mockTrpcPaymentCreatePreauthForBooking,
  mockTrpcOrderListByClient,
  mockTrpcOrderGetById,
  mockTrpcOrderCreate,
  mockTrpcOrderCancel,
  mockTrpcOrderAcceptQuote,
  mockTrpcOrderApproveHours,
  mockTrpcReviewStatusByOrderIds,
  mockTrpcReviewByOrder,
  mockTrpcPaymentGetByOrder,
  mockTrpcPaymentCreatePreauthForOrder,
  mockTrpcContactSubmit,
  mockTrpcUploadGetPresignedUploadUrl,
  mockTrpcSubcategoryGetByCategory,
  mockTrpcSubcategoryGetBySlug,
  mockTrpcSubcategoryGetById,
  mockTrpcSubcategoryGetAll,
  mockTrpcCategoryGetAll,
  mockTrpcCategoryGetById,
  mockTrpcCategoryGetBySlug,
  mockTrpcCategoryGetByKey,
  mockTrpcSubcategoryGetByCategoryId,
  mockTrpcSubcategoryGetBySlugAndCategoryId,
};

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock crash reporting
const mockSetUserContext = vi.fn();
const mockClearUserContext = vi.fn();
const mockCaptureException = vi.fn();
const mockCaptureMessage = vi.fn();

vi.mock("@/lib/crash-reporting", () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
  setUserContext: (...args: unknown[]) => mockSetUserContext(...args),
  clearUserContext: (...args: unknown[]) => mockClearUserContext(...args),
}));

// Export crash reporting mocks
export {
  mockSetUserContext,
  mockClearUserContext,
  mockCaptureException,
  mockCaptureMessage,
};

// Mock useQueryClient hook
const mockQueryClient = {
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  cancelQueries: vi.fn(),
};

vi.mock("@/hooks/shared/useQueryClient", () => ({
  useQueryClient: () => mockQueryClient,
}));

// Mock useAuth hook
const mockUser = { id: "user-1", email: "test@example.com" };

vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock useSmartPolling hook
vi.mock("@/hooks/shared/useSmartPolling", () => ({
  useSmartPolling: () => ({
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  }),
}));

// Mock invalidateRelatedQueries utility
vi.mock("@/lib/react-query/utils", () => ({
  invalidateRelatedQueries: vi.fn(() => ({
    onSuccess: vi.fn(),
    onError: vi.fn(),
    onSettled: vi.fn(),
  })),
}));

// Export mock query client for tests
export { mockQueryClient };

// Mock Supabase client
const mockGetSession = vi.fn().mockResolvedValue({
  data: { session: null },
  error: null,
});

const defaultUnsubscribeMock = vi.fn();
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: defaultUnsubscribeMock } },
});

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockResend = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resend: mockResend,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
    },
  },
}));

// Export Supabase mocks for use in tests
export {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignInWithPassword,
  mockSignUp,
  mockSignOut,
  mockResend,
  mockResetPasswordForEmail,
  mockUpdateUser,
};
