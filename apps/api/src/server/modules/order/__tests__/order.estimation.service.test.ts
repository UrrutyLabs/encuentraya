import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/container", () => ({
  TOKENS: {
    ProRepository: "ProRepository",
  },
}));

import { OrderEstimationService } from "../order.estimation.service";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type { OrderEstimateInput } from "@repo/domain";
import {
  DEFAULT_PLATFORM_FEE_RATE,
  DEFAULT_TAX_RATE,
} from "../order.calculations";

describe("OrderEstimationService", () => {
  let service: OrderEstimationService;
  let mockProRepository: ReturnType<typeof createMockProRepository>;

  function createMockProRepository(): {
    findById: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
    };
  }

  function createMockProProfile(
    overrides?: Partial<ProProfileEntity>
  ): ProProfileEntity {
    return {
      id: "pro-1",
      userId: "user-pro-1",
      displayName: "John Doe",
      email: "john@example.com",
      phone: "+59812345678",
      bio: "Experienced plumber",
      avatarUrl: null,
      hourlyRate: 100,
      categoryIds: ["cat-plumbing"],
      serviceArea: "Montevideo",
      status: "active",
      profileCompleted: true,
      completedJobsCount: 10,
      isTopPro: false,
      responseTimeMinutes: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockProRepository = createMockProRepository();
    service = new OrderEstimationService(
      mockProRepository as unknown as ProRepository
    );
  });

  describe("estimateOrderCost", () => {
    const createValidInput = (): OrderEstimateInput => ({
      proProfileId: "pro-1",
      estimatedHours: 2,
      categoryId: "cat-plumbing",
    });

    it("should estimate order cost successfully with correct calculations", async () => {
      const input = createValidInput();
      const proProfile = createMockProProfile({ hourlyRate: 100 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      // Verify pro repository was called
      expect(mockProRepository.findById).toHaveBeenCalledWith("pro-1");
      expect(mockProRepository.findById).toHaveBeenCalledTimes(1);

      // Verify calculations
      const expectedLaborAmount = 200; // 2 hours × 100 UYU/hour
      const expectedPlatformFeeAmount = 20; // 200 × 10%
      const expectedTaxAmount = 48.4; // (200 + 20) × 22%
      const expectedSubtotalAmount = 220; // 200 + 20
      const expectedTotalAmount = 268.4; // 220 + 48.4

      expect(result.laborAmount).toBe(expectedLaborAmount);
      expect(result.platformFeeAmount).toBe(expectedPlatformFeeAmount);
      expect(result.platformFeeRate).toBe(DEFAULT_PLATFORM_FEE_RATE);
      expect(result.taxAmount).toBe(expectedTaxAmount);
      expect(result.taxRate).toBe(DEFAULT_TAX_RATE);
      expect(result.subtotalAmount).toBe(expectedSubtotalAmount);
      expect(result.totalAmount).toBe(expectedTotalAmount);
      expect(result.currency).toBe("UYU");

      // Verify line items
      expect(result.lineItems).toHaveLength(3);
      expect(result.lineItems[0]).toEqual({
        type: "labor",
        description: "Labor (2 horas × 100 UYU/hora)",
        amount: expectedLaborAmount,
      });
      expect(result.lineItems[1]).toEqual({
        type: "platform_fee",
        description: "Tarifa de plataforma (10%)",
        amount: expectedPlatformFeeAmount,
      });
      expect(result.lineItems[2]).toEqual({
        type: "tax",
        description: "IVA (22%)",
        amount: expectedTaxAmount,
      });
    });

    it("should handle different hourly rates correctly", async () => {
      const input = createValidInput();
      const proProfile = createMockProProfile({ hourlyRate: 50 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      const expectedLaborAmount = 100; // 2 hours × 50 UYU/hour
      const expectedPlatformFeeAmount = 10; // 100 × 10%
      const expectedTaxAmount = 24.2; // (100 + 10) × 22%
      const expectedTotalAmount = 134.2; // 110 + 24.2

      expect(result.laborAmount).toBe(expectedLaborAmount);
      expect(result.platformFeeAmount).toBe(expectedPlatformFeeAmount);
      expect(result.taxAmount).toBe(expectedTaxAmount);
      expect(result.totalAmount).toBe(expectedTotalAmount);
    });

    it("should handle different estimated hours correctly", async () => {
      const input: OrderEstimateInput = {
        proProfileId: "pro-1",
        estimatedHours: 3.5,
      };
      const proProfile = createMockProProfile({ hourlyRate: 100 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      const expectedLaborAmount = 350; // 3.5 hours × 100 UYU/hour
      const expectedPlatformFeeAmount = 35; // 350 × 10%
      const expectedTaxAmount = 84.7; // (350 + 35) × 22%
      const expectedTotalAmount = 469.7; // 385 + 84.7

      expect(result.laborAmount).toBe(expectedLaborAmount);
      expect(result.platformFeeAmount).toBe(expectedPlatformFeeAmount);
      expect(result.taxAmount).toBe(expectedTaxAmount);
      expect(result.totalAmount).toBe(expectedTotalAmount);

      // Verify line item description includes correct hours
      expect(result.lineItems[0].description).toBe(
        "Labor (3.5 horas × 100 UYU/hora)"
      );
    });

    it("should round currency amounts to 2 decimal places", async () => {
      const input: OrderEstimateInput = {
        proProfileId: "pro-1",
        estimatedHours: 1.333, // Will result in non-round numbers
      };
      const proProfile = createMockProProfile({ hourlyRate: 75.5 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      // Verify all amounts are properly rounded
      // 1.333 × 75.5 = 100.6415 → roundCurrency → 100.64
      expect(result.laborAmount).toBe(100.64);

      // 100.64 × 0.1 = 10.064 → roundCurrency → 10.06
      expect(result.platformFeeAmount).toBe(10.06);

      // (100.64 + 10.06) × 0.22 = 110.70 × 0.22 = 24.354 → roundCurrency → 24.35
      expect(result.taxAmount).toBe(24.35);

      // 100.64 + 10.06 = 110.70 (subtotal)
      // 110.70 + 24.35 = 135.05 (total)
      expect(result.subtotalAmount).toBe(110.7);
      expect(result.totalAmount).toBe(135.05);
    });

    it("should throw error when pro profile is not found", async () => {
      const input = createValidInput();

      mockProRepository.findById.mockResolvedValue(null);

      await expect(service.estimateOrderCost(input)).rejects.toThrow(
        "Pro profile not found: pro-1"
      );

      expect(mockProRepository.findById).toHaveBeenCalledWith("pro-1");
    });

    it("should work without optional categoryId", async () => {
      const input: OrderEstimateInput = {
        proProfileId: "pro-1",
        estimatedHours: 2,
        // categoryId is optional
      };
      const proProfile = createMockProProfile({ hourlyRate: 100 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      expect(result).toBeDefined();
      expect(result.laborAmount).toBe(200);
      expect(mockProRepository.findById).toHaveBeenCalledWith("pro-1");
    });

    it("should calculate correct totals for edge case: 0.5 hours", async () => {
      const input: OrderEstimateInput = {
        proProfileId: "pro-1",
        estimatedHours: 0.5,
      };
      const proProfile = createMockProProfile({ hourlyRate: 100 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      const expectedLaborAmount = 50; // 0.5 hours × 100 UYU/hour
      const expectedPlatformFeeAmount = 5; // 50 × 10%
      const expectedTaxAmount = 12.1; // (50 + 5) × 22%
      const expectedTotalAmount = 67.1; // 55 + 12.1

      expect(result.laborAmount).toBe(expectedLaborAmount);
      expect(result.platformFeeAmount).toBe(expectedPlatformFeeAmount);
      expect(result.taxAmount).toBe(expectedTaxAmount);
      expect(result.totalAmount).toBe(expectedTotalAmount);
    });

    it("should handle high hourly rates correctly", async () => {
      const input = createValidInput();
      const proProfile = createMockProProfile({ hourlyRate: 500 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      const expectedLaborAmount = 1000; // 2 hours × 500 UYU/hour
      const expectedPlatformFeeAmount = 100; // 1000 × 10%
      const expectedTaxAmount = 242; // (1000 + 100) × 22%
      const expectedTotalAmount = 1342; // 1100 + 242

      expect(result.laborAmount).toBe(expectedLaborAmount);
      expect(result.platformFeeAmount).toBe(expectedPlatformFeeAmount);
      expect(result.taxAmount).toBe(expectedTaxAmount);
      expect(result.totalAmount).toBe(expectedTotalAmount);
    });

    it("should verify line items structure and order", async () => {
      const input = createValidInput();
      const proProfile = createMockProProfile({ hourlyRate: 100 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      // Verify line items are in correct order: labor, platform_fee, tax
      expect(result.lineItems[0].type).toBe("labor");
      expect(result.lineItems[1].type).toBe("platform_fee");
      expect(result.lineItems[2].type).toBe("tax");

      // Verify each line item has required fields
      result.lineItems.forEach((item) => {
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("description");
        expect(item).toHaveProperty("amount");
        expect(typeof item.type).toBe("string");
        expect(typeof item.description).toBe("string");
        expect(typeof item.amount).toBe("number");
        expect(item.amount).toBeGreaterThanOrEqual(0);
      });
    });

    it("should verify mathematical relationships between amounts", async () => {
      const input = createValidInput();
      const proProfile = createMockProProfile({ hourlyRate: 100 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      // Verify: subtotal = labor + platformFee
      expect(result.subtotalAmount).toBe(
        result.laborAmount + result.platformFeeAmount
      );

      // Verify: tax = (labor + platformFee) × taxRate
      const expectedTax =
        (result.laborAmount + result.platformFeeAmount) * DEFAULT_TAX_RATE;
      expect(result.taxAmount).toBeCloseTo(expectedTax, 2);

      // Verify: total = subtotal + tax
      expect(result.totalAmount).toBeCloseTo(
        result.subtotalAmount + result.taxAmount,
        2
      );

      // Verify: platformFee = labor × platformFeeRate
      const expectedPlatformFee =
        result.laborAmount * DEFAULT_PLATFORM_FEE_RATE;
      expect(result.platformFeeAmount).toBeCloseTo(expectedPlatformFee, 2);
    });
  });
});
