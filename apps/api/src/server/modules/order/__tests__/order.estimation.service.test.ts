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
      hourlyRate: 10000, // 100 UYU/hour in minor units (cents)
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
      const proProfile = createMockProProfile({ hourlyRate: 10000 }); // 100 UYU/hour in minor units

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      // Verify pro repository was called
      expect(mockProRepository.findById).toHaveBeenCalledWith("pro-1");
      expect(mockProRepository.findById).toHaveBeenCalledTimes(1);

      // Verify calculations (all amounts in minor units)
      const expectedLaborAmount = 20000; // 2 hours × 10000 cents/hour = 20000 cents
      const expectedPlatformFeeAmount = 2000; // 20000 × 10% = 2000 cents
      const expectedTaxAmount = 4840; // (20000 + 2000) × 22% = 4840 cents
      const expectedSubtotalAmount = 22000; // 20000 + 2000 = 22000 cents
      const expectedTotalAmount = 26840; // 22000 + 4840 = 26840 cents

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
        description: "Labor (2 horas × 100 UYU/hora)", // Description shows major units for display
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
      // Use 50 UYU/hour = 5000 cents/hour (minor units)
      const proProfile = createMockProProfile({ hourlyRate: 5000 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      // Conversion: 50 UYU → 5000 cents
      // 2 hours × 5000 cents/hour = 10000 cents
      const expectedLaborAmount = 10000;
      const expectedPlatformFeeAmount = 1000; // 10000 × 10% = 1000 cents
      const expectedTaxAmount = 2420; // (10000 + 1000) × 22% = 2420 cents
      const expectedTotalAmount = 13420; // 11000 + 2420 = 13420 cents

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
      const proProfile = createMockProProfile({ hourlyRate: 10000 }); // 100 UYU/hour in minor units

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      const expectedLaborAmount = 35000; // 3.5 hours × 10000 cents/hour = 35000 cents
      const expectedPlatformFeeAmount = 3500; // 35000 × 10% = 3500 cents
      const expectedTaxAmount = 8470; // (35000 + 3500) × 22% = 8470 cents
      const expectedTotalAmount = 46970; // 38500 + 8470 = 46970 cents

      expect(result.laborAmount).toBe(expectedLaborAmount);
      expect(result.platformFeeAmount).toBe(expectedPlatformFeeAmount);
      expect(result.taxAmount).toBe(expectedTaxAmount);
      expect(result.totalAmount).toBe(expectedTotalAmount);

      // Verify line item description includes correct hours
      expect(result.lineItems[0].description).toBe(
        "Labor (3.5 horas × 100 UYU/hora)"
      );
    });

    it("should round currency amounts correctly", async () => {
      const input: OrderEstimateInput = {
        proProfileId: "pro-1",
        estimatedHours: 1.333, // Will result in non-round numbers
      };
      // Use 75.5 UYU/hour = 7550 cents/hour (minor units)
      const proProfile = createMockProProfile({ hourlyRate: 7550 });

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      // Verify all amounts are properly rounded (in minor units)
      // Conversion: 75.5 UYU → 7550 cents
      // 1.333 × 7550 = 10064.15 → roundMinorUnits → 10064 cents
      expect(result.laborAmount).toBe(10064);

      // 10064 × 0.1 = 1006.4 → roundMinorUnits → 1006 cents
      expect(result.platformFeeAmount).toBe(1006);

      // (10064 + 1006) × 0.22 = 11070 × 0.22 = 2435.4 → roundMinorUnits → 2435 cents
      expect(result.taxAmount).toBe(2435);

      // 10064 + 1006 = 11070 (subtotal in cents)
      // 11070 + 2435 = 13505 (total in cents)
      expect(result.subtotalAmount).toBe(11070);
      expect(result.totalAmount).toBe(13505);
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
      const proProfile = createMockProProfile({ hourlyRate: 10000 }); // 100 UYU/hour in minor units

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      expect(result).toBeDefined();
      expect(result.laborAmount).toBe(20000); // 2 hours × 10000 cents/hour = 20000 cents
      expect(mockProRepository.findById).toHaveBeenCalledWith("pro-1");
    });

    it("should calculate correct totals for edge case: 0.5 hours", async () => {
      const input: OrderEstimateInput = {
        proProfileId: "pro-1",
        estimatedHours: 0.5,
      };
      const proProfile = createMockProProfile({ hourlyRate: 10000 }); // 100 UYU/hour in minor units

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      const expectedLaborAmount = 5000; // 0.5 hours × 10000 cents/hour = 5000 cents
      const expectedPlatformFeeAmount = 500; // 5000 × 10% = 500 cents
      const expectedTaxAmount = 1210; // (5000 + 500) × 22% = 1210 cents
      const expectedTotalAmount = 6710; // 5500 + 1210 = 6710 cents

      expect(result.laborAmount).toBe(expectedLaborAmount);
      expect(result.platformFeeAmount).toBe(expectedPlatformFeeAmount);
      expect(result.taxAmount).toBe(expectedTaxAmount);
      expect(result.totalAmount).toBe(expectedTotalAmount);
    });

    it("should handle high hourly rates correctly", async () => {
      const input = createValidInput();
      const proProfile = createMockProProfile({ hourlyRate: 50000 }); // 500 UYU/hour in minor units

      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.estimateOrderCost(input);

      const expectedLaborAmount = 100000; // 2 hours × 50000 cents/hour = 100000 cents
      const expectedPlatformFeeAmount = 10000; // 100000 × 10% = 10000 cents
      const expectedTaxAmount = 24200; // (100000 + 10000) × 22% = 24200 cents
      const expectedTotalAmount = 134200; // 110000 + 24200 = 134200 cents

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

      // Verify: tax = (labor + platformFee) × taxRate (all in minor units)
      const expectedTax =
        (result.laborAmount + result.platformFeeAmount) * DEFAULT_TAX_RATE;
      expect(result.taxAmount).toBeCloseTo(expectedTax, 0); // Round to nearest cent (minor unit)

      // Verify: total = subtotal + tax (all in minor units)
      expect(result.totalAmount).toBeCloseTo(
        result.subtotalAmount + result.taxAmount,
        0 // Round to nearest cent (minor unit)
      );

      // Verify: platformFee = labor × platformFeeRate (all in minor units)
      const expectedPlatformFee =
        result.laborAmount * DEFAULT_PLATFORM_FEE_RATE;
      expect(result.platformFeeAmount).toBeCloseTo(expectedPlatformFee, 0); // Round to nearest cent (minor unit)
    });
  });

  describe("estimateFromQuotedAmount", () => {
    it("should build cost breakdown from quoted amount (fixed-price)", () => {
      const quotedAmountCents = 50000; // 500 UYU
      const result = service.estimateFromQuotedAmount(quotedAmountCents, "UYU");

      const expectedPlatformFee = 5000; // 10%
      const expectedTax = Math.round((50000 + 5000) * DEFAULT_TAX_RATE); // 12100
      const expectedSubtotal = 55000;
      const expectedTotal = 55000 + expectedTax;

      expect(result.laborAmount).toBe(50000);
      expect(result.platformFeeAmount).toBe(expectedPlatformFee);
      expect(result.platformFeeRate).toBe(DEFAULT_PLATFORM_FEE_RATE);
      expect(result.taxAmount).toBe(expectedTax);
      expect(result.taxRate).toBe(DEFAULT_TAX_RATE);
      expect(result.subtotalAmount).toBe(expectedSubtotal);
      expect(result.totalAmount).toBe(expectedTotal);
      expect(result.currency).toBe("UYU");
      expect(result.lineItems).toHaveLength(3);
      expect(result.lineItems[0]).toEqual({
        type: "labor",
        description: "Labor (presupuesto fijo)",
        amount: 50000,
      });
    });

    it("should use default currency UYU when not provided", () => {
      const result = service.estimateFromQuotedAmount(30000);
      expect(result.currency).toBe("UYU");
      expect(result.laborAmount).toBe(30000);
    });
  });
});
