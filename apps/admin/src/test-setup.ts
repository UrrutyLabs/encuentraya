import { vi } from "vitest";
import "@testing-library/jest-dom";

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

// Mock tRPC client - basic structure for admin app
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    pro: {
      adminById: {
        useQuery: vi.fn(),
      },
      suspend: {
        useMutation: vi.fn(),
      },
      unsuspend: {
        useMutation: vi.fn(),
      },
      approve: {
        useMutation: vi.fn(),
      },
    },
    audit: {
      getResourceLogs: {
        useQuery: vi.fn(),
      },
    },
    useUtils: vi.fn(),
  },
}));
