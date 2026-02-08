import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/container", () => ({
  container: {},
  TOKENS: {
    IStorageService: "IStorageService",
    OrderService: "OrderService",
    ProRepository: "ProRepository",
  },
}));

import { UploadService } from "../upload.service";
import type { IStorageService } from "../storage.types";
import type { OrderService } from "@modules/order/order.service";
import type { ProRepository } from "@modules/pro/pro.repo";
import { Role } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import type { Order } from "@repo/domain";
import {
  OrderNotFoundError,
  UnauthorizedOrderActionError,
} from "@modules/order/order.errors";

function createMockStorageService(): {
  createPresignedUploadUrl: ReturnType<typeof vi.fn>;
  createSignedDownloadUrl: ReturnType<typeof vi.fn>;
} {
  return {
    createPresignedUploadUrl: vi
      .fn()
      .mockImplementation((params: { path: string; bucket?: string }) => {
        if (params.bucket === "avatars") {
          return Promise.resolve({
            uploadUrl:
              "https://storage.example.com/avatars/signed-upload?token=abc",
            storagePath: params.path,
          });
        }
        return Promise.resolve({
          uploadUrl: "https://storage.example.com/signed-upload?token=abc",
          storageUrl:
            "https://storage.example.com/public/bucket/path/to/file.jpg",
        });
      }),
    createSignedDownloadUrl: vi.fn().mockResolvedValue({
      url: "https://storage.example.com/avatars/signed?token=xyz",
    }),
  };
}

function createMockOrderService(): {
  getOrderOrThrow: ReturnType<typeof vi.fn>;
} {
  return {
    getOrderOrThrow: vi.fn(),
  };
}

function createMockProRepository(): {
  findByUserId: ReturnType<typeof vi.fn>;
} {
  return {
    findByUserId: vi.fn(),
  };
}

function createClientActor(overrides?: Partial<Actor>): Actor {
  return {
    id: "user-client-1",
    role: Role.CLIENT,
    ...overrides,
  };
}

function createProActor(overrides?: Partial<Actor>): Actor {
  return {
    id: "user-pro-1",
    role: Role.PRO,
    ...overrides,
  };
}

function createMinimalOrder(overrides?: Partial<Order>): Order {
  return {
    id: "order-1",
    displayId: "O0001",
    clientUserId: "client-1",
    proProfileId: "pro-1",
    categoryId: "cat-1",
    status: "in_progress" as Order["status"],
    scheduledWindowStartAt: new Date().toISOString(),
    addressText: "123 Main St",
    pricingMode: "fixed",
    currency: "UYU",
    estimatedHours: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Order;
}

describe("UploadService", () => {
  let service: UploadService;
  let mockStorage: ReturnType<typeof createMockStorageService>;
  let mockOrderService: ReturnType<typeof createMockOrderService>;
  let mockProRepo: ReturnType<typeof createMockProRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = createMockStorageService();
    mockOrderService = createMockOrderService();
    mockProRepo = createMockProRepository();
    service = new UploadService(
      mockStorage as unknown as IStorageService,
      mockOrderService as unknown as OrderService,
      mockProRepo as unknown as ProRepository
    );
  });

  describe("createPresignedUploadUrl", () => {
    describe("order_photo", () => {
      it("returns uploadUrl and storageUrl when client requests order_photo", async () => {
        const actor = createClientActor();
        const input = {
          purpose: "order_photo" as const,
          orderId: "pending",
          contentType: "image/jpeg",
          extension: "jpg",
        };

        const result = await service.createPresignedUploadUrl(actor, input);

        expect(result).toHaveProperty("uploadUrl");
        expect(result).toHaveProperty("storageUrl");
        expect(result.uploadUrl).toBe(
          "https://storage.example.com/signed-upload?token=abc"
        );
        expect(result.storageUrl).toMatch(/^https:\/\//);
        expect(mockStorage.createPresignedUploadUrl).toHaveBeenCalledTimes(1);
        const call = mockStorage.createPresignedUploadUrl.mock.calls[0][0];
        expect(call.path).toMatch(/^order-photos\/pending\/user-client-1\//);
        expect(call.path).toMatch(/\.jpg$/);
        expect(call.contentType).toBe("image/jpeg");
      });

      it("throws when pro requests order_photo", async () => {
        const actor = createProActor();
        const input = {
          purpose: "order_photo" as const,
          orderId: "pending",
          contentType: "image/jpeg",
        };

        await expect(
          service.createPresignedUploadUrl(actor, input)
        ).rejects.toThrow("Only clients can request order_photo upload URLs");

        expect(mockStorage.createPresignedUploadUrl).not.toHaveBeenCalled();
      });

      it("throws when contentType is not allowed", async () => {
        const actor = createClientActor();
        const input = {
          purpose: "order_photo" as const,
          orderId: "pending",
          contentType: "application/pdf",
        };

        await expect(
          service.createPresignedUploadUrl(actor, input)
        ).rejects.toThrow("Invalid contentType");

        expect(mockStorage.createPresignedUploadUrl).not.toHaveBeenCalled();
      });

      it("uses extension from content-type when extension not provided", async () => {
        const actor = createClientActor();
        const input = {
          purpose: "order_photo" as const,
          orderId: "pending",
          contentType: "image/png",
        };

        await service.createPresignedUploadUrl(actor, input);

        const call = mockStorage.createPresignedUploadUrl.mock.calls[0][0];
        expect(call.path).toMatch(/\.png$/);
      });
    });

    describe("work_proof", () => {
      it("returns uploadUrl and storageUrl when pro assigned to order requests work_proof", async () => {
        const actor = createProActor();
        const order = createMinimalOrder({
          id: "order-1",
          proProfileId: "pro-1",
        });
        mockOrderService.getOrderOrThrow.mockResolvedValue(order);
        mockProRepo.findByUserId.mockResolvedValue({
          id: "pro-1",
          userId: "user-pro-1",
        });
        const input = {
          purpose: "work_proof" as const,
          orderId: "order-1",
          contentType: "image/jpeg",
          extension: "jpg",
        };

        const result = await service.createPresignedUploadUrl(actor, input);

        expect(result.uploadUrl).toBeDefined();
        expect(result.storageUrl).toBeDefined();
        expect(mockOrderService.getOrderOrThrow).toHaveBeenCalledWith(
          "order-1"
        );
        expect(mockProRepo.findByUserId).toHaveBeenCalledWith("user-pro-1");
        expect(mockStorage.createPresignedUploadUrl).toHaveBeenCalledTimes(1);
        const call = mockStorage.createPresignedUploadUrl.mock.calls[0][0];
        expect(call.path).toMatch(/^work-proof\/order-1\//);
        expect(call.path).toMatch(/\.jpg$/);
      });

      it("throws when client requests work_proof", async () => {
        const actor = createClientActor();
        const input = {
          purpose: "work_proof" as const,
          orderId: "order-1",
          contentType: "image/jpeg",
        };
        const order = createMinimalOrder();
        mockOrderService.getOrderOrThrow.mockResolvedValue(order);

        await expect(
          service.createPresignedUploadUrl(actor, input)
        ).rejects.toThrow(UnauthorizedOrderActionError);

        expect(mockStorage.createPresignedUploadUrl).not.toHaveBeenCalled();
      });

      it("throws when pro is not assigned to order", async () => {
        const actor = createProActor();
        const order = createMinimalOrder({
          id: "order-1",
          proProfileId: "other-pro-id",
        });
        mockOrderService.getOrderOrThrow.mockResolvedValue(order);
        mockProRepo.findByUserId.mockResolvedValue({
          id: "pro-1",
          userId: "user-pro-1",
        });
        const input = {
          purpose: "work_proof" as const,
          orderId: "order-1",
          contentType: "image/jpeg",
        };

        await expect(
          service.createPresignedUploadUrl(actor, input)
        ).rejects.toThrow(UnauthorizedOrderActionError);

        expect(mockStorage.createPresignedUploadUrl).not.toHaveBeenCalled();
      });

      it("throws when order is not found for work_proof", async () => {
        const actor = createProActor();
        mockOrderService.getOrderOrThrow.mockRejectedValue(
          new OrderNotFoundError("order-1")
        );
        const input = {
          purpose: "work_proof" as const,
          orderId: "order-1",
          contentType: "image/jpeg",
        };

        await expect(
          service.createPresignedUploadUrl(actor, input)
        ).rejects.toThrow(OrderNotFoundError);

        expect(mockStorage.createPresignedUploadUrl).not.toHaveBeenCalled();
      });

      it("throws when contentType is invalid for work_proof", async () => {
        const actor = createProActor();
        const order = createMinimalOrder();
        mockOrderService.getOrderOrThrow.mockResolvedValue(order);
        mockProRepo.findByUserId.mockResolvedValue({
          id: "pro-1",
          userId: "user-pro-1",
        });
        const input = {
          purpose: "work_proof" as const,
          orderId: "order-1",
          contentType: "image/gif",
        };

        await expect(
          service.createPresignedUploadUrl(actor, input)
        ).rejects.toThrow("Invalid contentType");

        expect(mockStorage.createPresignedUploadUrl).not.toHaveBeenCalled();
      });
    });

    describe("pro_avatar", () => {
      it("returns uploadUrl and storagePath when pro requests pro_avatar", async () => {
        const actor = createProActor();
        const input = {
          purpose: "pro_avatar" as const,
          contentType: "image/jpeg",
          extension: "jpg",
        };

        const result = await service.createPresignedUploadUrl(actor, input);

        expect(result.uploadUrl).toBeDefined();
        expect(result.storagePath).toBeDefined();
        expect(result.storagePath).toMatch(/^pro\/user-pro-1\//);
        expect(result.storagePath).toMatch(/\.jpg$/);
        expect(mockStorage.createPresignedUploadUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            contentType: "image/jpeg",
            bucket: "avatars",
          })
        );
        const call = mockStorage.createPresignedUploadUrl.mock.calls[0][0];
        expect(call.path).toMatch(/^pro\/user-pro-1\//);
      });

      it("throws when client requests pro_avatar", async () => {
        const actor = createClientActor();
        const input = {
          purpose: "pro_avatar" as const,
          contentType: "image/jpeg",
        };

        await expect(
          service.createPresignedUploadUrl(actor, input)
        ).rejects.toThrow("Only pros can request pro_avatar upload URLs");

        expect(mockStorage.createPresignedUploadUrl).not.toHaveBeenCalled();
      });
    });

    describe("client_avatar", () => {
      it("returns uploadUrl and storagePath when client requests client_avatar", async () => {
        const actor = createClientActor();
        const input = {
          purpose: "client_avatar" as const,
          contentType: "image/png",
          extension: "png",
        };

        const result = await service.createPresignedUploadUrl(actor, input);

        expect(result.uploadUrl).toBeDefined();
        expect(result.storagePath).toBeDefined();
        expect(result.storagePath).toMatch(/^client\/user-client-1\//);
        expect(result.storagePath).toMatch(/\.png$/);
        expect(mockStorage.createPresignedUploadUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            contentType: "image/png",
            bucket: "avatars",
          })
        );
      });

      it("throws when pro requests client_avatar", async () => {
        const actor = createProActor();
        const input = {
          purpose: "client_avatar" as const,
          contentType: "image/jpeg",
        };

        await expect(
          service.createPresignedUploadUrl(actor, input)
        ).rejects.toThrow("Only clients can request client_avatar upload URLs");

        expect(mockStorage.createPresignedUploadUrl).not.toHaveBeenCalled();
      });
    });

    it("calls storage with expiresInSeconds", async () => {
      const actor = createClientActor();
      const input = {
        purpose: "order_photo" as const,
        orderId: "pending",
        contentType: "image/webp",
      };

      await service.createPresignedUploadUrl(actor, input);

      const call = mockStorage.createPresignedUploadUrl.mock.calls[0][0];
      expect(call.expiresInSeconds).toBe(3600);
    });
  });
});
