import { describe, it, expect, beforeEach, vi } from "vitest";
import { PayoutService, PayoutError } from "../payout.service";
import type { EarningRepository, EarningEntity } from "../earning.repo";
import type { PayoutRepository, PayoutEntity } from "../payout.repo";
import type {
  PayoutItemRepository,
  PayoutItemEntity,
} from "../payoutItem.repo";
import type {
  ProPayoutProfileRepository,
  ProPayoutProfileEntity,
} from "../proPayoutProfile.repo";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type { PayoutProviderClient } from "../provider";
import { Role } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { getPayoutProviderClient } from "../registry";

vi.mock("../registry", () => ({
  getPayoutProviderClient: vi.fn(),
}));

describe("PayoutService", () => {
  let service: PayoutService;
  let mockEarningRepository: ReturnType<typeof createMockEarningRepository>;
  let mockPayoutRepository: ReturnType<typeof createMockPayoutRepository>;
  let mockPayoutItemRepository: ReturnType<
    typeof createMockPayoutItemRepository
  >;
  let mockProPayoutProfileRepository: ReturnType<
    typeof createMockProPayoutProfileRepository
  >;
  let mockProRepository: ReturnType<typeof createMockProRepository>;
  let mockProviderClient: ReturnType<typeof createMockProviderClient>;

  function createMockEarningRepository(): {
    listPayableByPro: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    markManyStatus: ReturnType<typeof vi.fn>;
  } {
    return {
      listPayableByPro: vi.fn(),
      findById: vi.fn(),
      markManyStatus: vi.fn(),
    };
  }

  function createMockPayoutRepository(): {
    createPayout: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    listAll: ReturnType<typeof vi.fn>;
  } {
    return {
      createPayout: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      listAll: vi.fn(),
    };
  }

  function createMockPayoutItemRepository(): {
    createMany: ReturnType<typeof vi.fn>;
    findByPayoutId: ReturnType<typeof vi.fn>;
  } {
    return {
      createMany: vi.fn(),
      findByPayoutId: vi.fn(),
    };
  }

  function createMockProPayoutProfileRepository(): {
    findByProProfileId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByProProfileId: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findById: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
      findAll: vi.fn(),
    };
  }

  function createMockProviderClient(): PayoutProviderClient {
    return {
      createPayout: vi.fn() as unknown as PayoutProviderClient["createPayout"],
    };
  }

  function createMockActor(role: Role = Role.ADMIN, id = "admin-1"): Actor {
    return { id, role };
  }

  function createMockProProfile(
    overrides?: Partial<ProProfileEntity>
  ): ProProfileEntity {
    return {
      id: "pro-1",
      userId: "user-1",
      displayName: "Test Pro",
      email: "pro@example.com",
      phone: null,
      bio: null,
      avatarUrl: null,
      hourlyRate: 10000, // 100 UYU/hour in minor units (cents)
      categoryIds: [],
      serviceArea: null,
      baseCountryCode: null,
      baseLatitude: null,
      baseLongitude: null,
      basePostalCode: null,
      baseAddressLine: null,
      serviceRadiusKm: 10,
      status: "active",
      profileCompleted: false,
      completedJobsCount: 0,
      isTopPro: false,
      responseTimeMinutes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockEarning(
    overrides?: Partial<EarningEntity>
  ): EarningEntity {
    return {
      id: "earning-1",
      orderId: "order-1",
      proProfileId: "pro-1",
      clientUserId: "client-1",
      currency: "UYU",
      grossAmount: 20000,
      platformFeeAmount: 2000,
      netAmount: 18000,
      status: "PAYABLE",
      availableAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockPayoutProfile(
    overrides?: Partial<ProPayoutProfileEntity>
  ): ProPayoutProfileEntity {
    return {
      id: "payout-profile-1",
      proProfileId: "pro-1",
      payoutMethod: "BANK_TRANSFER",
      fullName: "John Doe",
      documentId: "12345678",
      bankName: "Test Bank",
      bankAccountType: "CHECKING",
      bankAccountNumber: "1234567890",
      currency: "UYU",
      isComplete: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockPayout(overrides?: Partial<PayoutEntity>): PayoutEntity {
    return {
      id: "payout-1",
      proProfileId: "pro-1",
      provider: "BANK_TRANSFER",
      status: "CREATED",
      currency: "UYU",
      amount: 18000,
      providerReference: null,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sentAt: null,
      settledAt: null,
      ...overrides,
    };
  }

  function createMockPayoutItem(
    overrides?: Partial<PayoutItemEntity>
  ): PayoutItemEntity {
    return {
      id: "payout-item-1",
      payoutId: "payout-1",
      earningId: "earning-1",
      amount: 18000,
      createdAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockEarningRepository = createMockEarningRepository();
    mockPayoutRepository = createMockPayoutRepository();
    mockPayoutItemRepository = createMockPayoutItemRepository();
    mockProPayoutProfileRepository = createMockProPayoutProfileRepository();
    mockProRepository = createMockProRepository();
    mockProviderClient = createMockProviderClient();

    vi.mocked(getPayoutProviderClient).mockReturnValue(mockProviderClient);

    service = new PayoutService(
      mockEarningRepository as unknown as EarningRepository,
      mockPayoutRepository as unknown as PayoutRepository,
      mockPayoutItemRepository as unknown as PayoutItemRepository,
      mockProPayoutProfileRepository as unknown as ProPayoutProfileRepository,
      mockProRepository as unknown as ProRepository
    );
  });

  describe("createPayoutForPro", () => {
    it("should create a payout for a pro", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile({ id: "pro-1" });
      const earnings = [
        createMockEarning({ id: "earning-1", netAmount: 10000 }),
        createMockEarning({ id: "earning-2", netAmount: 8000 }),
      ];
      const payoutProfile = createMockPayoutProfile({ isComplete: true });
      const payout = createMockPayout({ id: "payout-1", amount: 18000 });
      const payoutItems = [
        createMockPayoutItem({ earningId: "earning-1", amount: 10000 }),
        createMockPayoutItem({ earningId: "earning-2", amount: 8000 }),
      ];

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockEarningRepository.listPayableByPro.mockResolvedValue(earnings);
      mockProPayoutProfileRepository.findByProProfileId.mockResolvedValue(
        payoutProfile
      );
      mockPayoutRepository.createPayout.mockResolvedValue(payout);
      mockPayoutItemRepository.createMany.mockResolvedValue(payoutItems);

      const result = await service.createPayoutForPro(adminActor, {
        proProfileId: "pro-1",
        provider: "BANK_TRANSFER",
      });

      expect(result.payoutId).toBe("payout-1");
      expect(mockProRepository.findById).toHaveBeenCalledWith("pro-1");
      expect(mockEarningRepository.listPayableByPro).toHaveBeenCalled();
      expect(
        mockProPayoutProfileRepository.findByProProfileId
      ).toHaveBeenCalledWith("pro-1");
      expect(mockPayoutRepository.createPayout).toHaveBeenCalledWith({
        proProfileId: "pro-1",
        provider: "BANK_TRANSFER",
        currency: "UYU",
        amount: 18000,
      });
      expect(mockPayoutItemRepository.createMany).toHaveBeenCalledWith(
        "payout-1",
        [
          { earningId: "earning-1", amount: 10000 },
          { earningId: "earning-2", amount: 8000 },
        ]
      );
    });

    it("should throw error if actor is not admin", async () => {
      const actor = createMockActor(Role.PRO);

      await expect(
        service.createPayoutForPro(actor, {
          proProfileId: "pro-1",
          provider: "BANK_TRANSFER",
        })
      ).rejects.toThrow(PayoutError);
      expect(mockProRepository.findById).not.toHaveBeenCalled();
    });

    it("should throw error if pro profile not found", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      mockProRepository.findById.mockResolvedValue(null);

      await expect(
        service.createPayoutForPro(adminActor, {
          proProfileId: "pro-1",
          provider: "BANK_TRANSFER",
        })
      ).rejects.toThrow(PayoutError);
    });

    it("should throw error if no payable earnings found", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile();

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockEarningRepository.listPayableByPro.mockResolvedValue([]);

      await expect(
        service.createPayoutForPro(adminActor, {
          proProfileId: "pro-1",
          provider: "BANK_TRANSFER",
        })
      ).rejects.toThrow("No payable earnings found");
    });

    it("should throw error if payout profile not found", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile();
      const earnings = [createMockEarning()];

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockEarningRepository.listPayableByPro.mockResolvedValue(earnings);
      mockProPayoutProfileRepository.findByProProfileId.mockResolvedValue(null);

      await expect(
        service.createPayoutForPro(adminActor, {
          proProfileId: "pro-1",
          provider: "BANK_TRANSFER",
        })
      ).rejects.toThrow("Payout profile not found");
    });

    it("should throw error if payout profile is not complete", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile();
      const earnings = [createMockEarning()];
      const payoutProfile = createMockPayoutProfile({ isComplete: false });

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockEarningRepository.listPayableByPro.mockResolvedValue(earnings);
      mockProPayoutProfileRepository.findByProProfileId.mockResolvedValue(
        payoutProfile
      );

      await expect(
        service.createPayoutForPro(adminActor, {
          proProfileId: "pro-1",
          provider: "BANK_TRANSFER",
        })
      ).rejects.toThrow("Payout profile for pro pro-1 is not complete");
    });

    it("should throw error if total amount is zero or negative", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile();
      const earnings = [createMockEarning({ netAmount: 0 })];
      const payoutProfile = createMockPayoutProfile({ isComplete: true });

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockEarningRepository.listPayableByPro.mockResolvedValue(earnings);
      mockProPayoutProfileRepository.findByProProfileId.mockResolvedValue(
        payoutProfile
      );

      await expect(
        service.createPayoutForPro(adminActor, {
          proProfileId: "pro-1",
          provider: "BANK_TRANSFER",
        })
      ).rejects.toThrow("Total payable amount is zero or negative");
    });
  });

  describe("sendPayout", () => {
    it("should send a payout to the provider", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const payout = createMockPayout({
        id: "payout-1",
        status: "CREATED",
        proProfileId: "pro-1",
      });
      const payoutProfile = createMockPayoutProfile({
        proProfileId: "pro-1",
        bankName: "Test Bank",
        bankAccountNumber: "1234567890",
        fullName: "John Doe",
        documentId: "12345678",
      });
      const payoutItems = [
        createMockPayoutItem({ earningId: "earning-1" }),
        createMockPayoutItem({ earningId: "earning-2" }),
      ];
      const updatedPayout = createMockPayout({
        id: "payout-1",
        status: "SENT",
        providerReference: "provider-ref-123",
        sentAt: new Date(),
      });

      mockPayoutRepository.findById.mockResolvedValue(payout);
      mockProPayoutProfileRepository.findByProProfileId.mockResolvedValue(
        payoutProfile
      );
      vi.mocked(mockProviderClient.createPayout).mockResolvedValue({
        provider: "BANK_TRANSFER",
        providerReference: "provider-ref-123",
      });
      mockPayoutRepository.updateStatus.mockResolvedValue(updatedPayout);
      mockPayoutItemRepository.findByPayoutId.mockResolvedValue(payoutItems);
      mockEarningRepository.markManyStatus.mockResolvedValue([
        createMockEarning({ id: "earning-1", status: "PAID" }),
        createMockEarning({ id: "earning-2", status: "PAID" }),
      ]);

      const result = await service.sendPayout(adminActor, {
        payoutId: "payout-1",
      });

      expect(result.payoutId).toBe("payout-1");
      expect(result.providerReference).toBe("provider-ref-123");
      expect(mockPayoutRepository.findById).toHaveBeenCalledWith("payout-1");
      expect(
        mockProPayoutProfileRepository.findByProProfileId
      ).toHaveBeenCalledWith("pro-1");
      expect(mockProviderClient.createPayout).toHaveBeenCalledWith({
        money: {
          amount: 18000,
          currency: "UYU",
        },
        destination: {
          method: "BANK_TRANSFER",
          bankName: "Test Bank",
          bankAccountNumber: "1234567890",
          fullName: "John Doe",
          documentId: "12345678",
        },
        reference: "payout-1",
      });
      expect(mockPayoutRepository.updateStatus).toHaveBeenCalledWith(
        "payout-1",
        "SENT",
        {
          providerReference: "provider-ref-123",
          sentAt: expect.any(Date),
        }
      );
      expect(mockEarningRepository.markManyStatus).toHaveBeenCalledWith(
        ["earning-1", "earning-2"],
        "PAID"
      );
    });

    it("should throw error if actor is not admin", async () => {
      const actor = createMockActor(Role.PRO);

      await expect(
        service.sendPayout(actor, { payoutId: "payout-1" })
      ).rejects.toThrow(PayoutError);
    });

    it("should throw error if payout not found", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      mockPayoutRepository.findById.mockResolvedValue(null);

      await expect(
        service.sendPayout(adminActor, { payoutId: "payout-1" })
      ).rejects.toThrow("Payout not found: payout-1");
    });

    it("should throw error if payout status is not CREATED", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const payout = createMockPayout({ status: "SENT" });

      mockPayoutRepository.findById.mockResolvedValue(payout);

      await expect(
        service.sendPayout(adminActor, { payoutId: "payout-1" })
      ).rejects.toThrow("Payout payout-1 must be CREATED to send");
    });

    it("should throw error if payout profile not found", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const payout = createMockPayout({ status: "CREATED" });

      mockPayoutRepository.findById.mockResolvedValue(payout);
      mockProPayoutProfileRepository.findByProProfileId.mockResolvedValue(null);

      await expect(
        service.sendPayout(adminActor, { payoutId: "payout-1" })
      ).rejects.toThrow("Payout profile not found");
    });
  });

  describe("listPayablePros", () => {
    it("should list pros with payable earnings", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const pros = [
        createMockProProfile({ id: "pro-1", displayName: "Pro 1" }),
        createMockProProfile({ id: "pro-2", displayName: "Pro 2" }),
      ];
      const earnings1 = [
        createMockEarning({ id: "earning-1", netAmount: 10000 }),
        createMockEarning({ id: "earning-2", netAmount: 8000 }),
      ];
      const earnings2 = [
        createMockEarning({ id: "earning-3", netAmount: 5000 }),
      ];
      const payoutProfile1 = createMockPayoutProfile({
        proProfileId: "pro-1",
        isComplete: true,
      });
      const payoutProfile2 = createMockPayoutProfile({
        proProfileId: "pro-2",
        isComplete: false,
      });

      mockProRepository.findAll.mockResolvedValue(pros);
      mockEarningRepository.listPayableByPro
        .mockResolvedValueOnce(earnings1)
        .mockResolvedValueOnce(earnings2);
      mockProPayoutProfileRepository.findByProProfileId
        .mockResolvedValueOnce(payoutProfile1)
        .mockResolvedValueOnce(payoutProfile2);

      const result = await service.listPayablePros(adminActor);

      expect(result).toHaveLength(2);
      expect(result[0].proProfileId).toBe("pro-1");
      expect(result[0].totalPayable).toBe(18000);
      expect(result[0].earningsCount).toBe(2);
      expect(result[0].payoutProfileComplete).toBe(true);
      expect(result[1].proProfileId).toBe("pro-2");
      expect(result[1].totalPayable).toBe(5000);
      expect(result[1].payoutProfileComplete).toBe(false);
    });

    it("should throw error if actor is not admin", async () => {
      const actor = createMockActor(Role.PRO);

      await expect(service.listPayablePros(actor)).rejects.toThrow(PayoutError);
    });

    it("should filter out pros with no payable earnings", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const pros = [
        createMockProProfile({ id: "pro-1" }),
        createMockProProfile({ id: "pro-2" }),
      ];

      mockProRepository.findAll.mockResolvedValue(pros);
      mockEarningRepository.listPayableByPro
        .mockResolvedValueOnce([createMockEarning()])
        .mockResolvedValueOnce([]);
      mockProPayoutProfileRepository.findByProProfileId.mockResolvedValue(
        createMockPayoutProfile()
      );

      const result = await service.listPayablePros(adminActor);

      expect(result).toHaveLength(1);
      expect(result[0].proProfileId).toBe("pro-1");
    });
  });

  describe("listPayouts", () => {
    it("should list all payouts", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const payouts = [
        createMockPayout({ id: "payout-1" }),
        createMockPayout({ id: "payout-2" }),
      ];

      mockPayoutRepository.listAll.mockResolvedValue(payouts);

      const result = await service.listPayouts(adminActor);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("payout-1");
      expect(mockPayoutRepository.listAll).toHaveBeenCalledWith(undefined);
    });

    it("should limit results if limit is provided", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const payouts = [createMockPayout()];

      mockPayoutRepository.listAll.mockResolvedValue(payouts);

      await service.listPayouts(adminActor, 10);

      expect(mockPayoutRepository.listAll).toHaveBeenCalledWith(10);
    });

    it("should throw error if actor is not admin", async () => {
      const actor = createMockActor(Role.PRO);

      await expect(service.listPayouts(actor)).rejects.toThrow(PayoutError);
    });
  });

  describe("getPayout", () => {
    it("should get payout by ID with earnings", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const payout = createMockPayout({ id: "payout-1" });
      const payoutItems = [
        createMockPayoutItem({ earningId: "earning-1" }),
        createMockPayoutItem({ earningId: "earning-2" }),
      ];
      const earnings = [
        createMockEarning({
          id: "earning-1",
          orderId: "order-1",
          netAmount: 10000,
        }),
        createMockEarning({
          id: "earning-2",
          orderId: "order-2",
          netAmount: 8000,
        }),
      ];

      mockPayoutRepository.findById.mockResolvedValue(payout);
      mockPayoutItemRepository.findByPayoutId.mockResolvedValue(payoutItems);
      mockEarningRepository.findById
        .mockResolvedValueOnce(earnings[0])
        .mockResolvedValueOnce(earnings[1]);

      const result = await service.getPayout(adminActor, "payout-1");

      expect(result.id).toBe("payout-1");
      expect(result.earnings).toHaveLength(2);
      expect(result.earnings[0].earningId).toBe("earning-1");
      expect(result.earnings[0].orderId).toBe("order-1");
      expect(result.earnings[0].netAmount).toBe(10000);
      expect(mockPayoutRepository.findById).toHaveBeenCalledWith("payout-1");
      expect(mockPayoutItemRepository.findByPayoutId).toHaveBeenCalledWith(
        "payout-1"
      );
    });

    it("should throw error if actor is not admin", async () => {
      const actor = createMockActor(Role.PRO);

      await expect(service.getPayout(actor, "payout-1")).rejects.toThrow(
        PayoutError
      );
    });

    it("should throw error if payout not found", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      mockPayoutRepository.findById.mockResolvedValue(null);

      await expect(service.getPayout(adminActor, "payout-1")).rejects.toThrow(
        "Payout not found: payout-1"
      );
    });

    it("should throw error if earning not found", async () => {
      const adminActor = createMockActor(Role.ADMIN);
      const payout = createMockPayout();
      const payoutItems = [createMockPayoutItem({ earningId: "earning-1" })];

      mockPayoutRepository.findById.mockResolvedValue(payout);
      mockPayoutItemRepository.findByPayoutId.mockResolvedValue(payoutItems);
      mockEarningRepository.findById.mockResolvedValue(null);

      await expect(service.getPayout(adminActor, "payout-1")).rejects.toThrow(
        "Earning not found: earning-1"
      );
    });
  });
});
