import { describe, it, expect, beforeEach, vi } from "vitest";
import { EarningService, EarningCreationError } from "../earning.service";
import type { EarningRepository, EarningEntity } from "../earning.repo";
import type { BookingRepository, BookingEntity } from "@modules/booking/booking.repo";
import type { PaymentRepository, PaymentEntity } from "@modules/payment/payment.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import { BookingStatus, PaymentStatus, PaymentProvider, PaymentType } from "@repo/domain";
import { BookingNotFoundError } from "@modules/booking/booking.errors";
import type { Actor } from "@infra/auth/roles";

describe("EarningService", () => {
  let service: EarningService;
  let mockEarningRepository: ReturnType<typeof createMockEarningRepository>;
  let mockBookingRepository: ReturnType<typeof createMockBookingRepository>;
  let mockPaymentRepository: ReturnType<typeof createMockPaymentRepository>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;

  function createMockEarningRepository(): {
    findByBookingId: ReturnType<typeof vi.fn>;
    createFromBooking: ReturnType<typeof vi.fn>;
    listPendingDue: ReturnType<typeof vi.fn>;
    markManyStatus: ReturnType<typeof vi.fn>;
  } {
    return {
      findByBookingId: vi.fn(),
      createFromBooking: vi.fn(),
      listPendingDue: vi.fn(),
      markManyStatus: vi.fn(),
    };
  }

  function createMockBookingRepository(): {
    findById: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn().mockResolvedValue({
        id: "booking-1",
        displayId: "A0002",
        clientUserId: "client-1",
        proProfileId: "pro-1",
        category: "PLUMBING",
        status: BookingStatus.COMPLETED,
        scheduledAt: new Date(),
        hoursEstimate: 2,
        addressText: "123 Main St",
        isFirstBooking: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
  }

  function createMockPaymentRepository(): {
    findByBookingId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByBookingId: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByUserId: vi.fn(),
    };
  }

  function createMockActor(role: "CLIENT" | "PRO" | "ADMIN" | "SYSTEM" = "ADMIN", id = "actor-1"): Actor | { role: "SYSTEM" } {
    if (role === "SYSTEM") {
      return { role: "SYSTEM" };
    }
    return { id, role: role as Actor["role"] };
  }

  function createMockBooking(overrides?: Partial<BookingEntity>): BookingEntity {
    return {
      id: "booking-1",
      displayId: "A0002",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      category: "PLUMBING",
      status: BookingStatus.COMPLETED,
      scheduledAt: new Date(),
      hoursEstimate: 2,
      addressText: "123 Main St",
      isFirstBooking: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockPayment(overrides?: Partial<PaymentEntity>): PaymentEntity {
    return {
      id: "payment-1",
      provider: PaymentProvider.MERCADO_PAGO,
      type: PaymentType.PREAUTH,
      status: PaymentStatus.CAPTURED,
      bookingId: "booking-1",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      currency: "UYU",
      amountEstimated: 20000,
      amountAuthorized: 20000,
      amountCaptured: 20000,
      providerReference: "mp-ref-123",
      checkoutUrl: null,
      idempotencyKey: "booking-1-1234567890",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockEarning(overrides?: Partial<EarningEntity>): EarningEntity {
    return {
      id: "earning-1",
      bookingId: "booking-1",
      proProfileId: "pro-1",
      clientUserId: "client-1",
      currency: "UYU",
      grossAmount: 20000,
      platformFeeAmount: 2000,
      netAmount: 18000,
      status: "PENDING",
      availableAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockEarningRepository = createMockEarningRepository();
    mockBookingRepository = createMockBookingRepository();
    mockPaymentRepository = createMockPaymentRepository();
    mockProRepository = createMockProRepository();

    service = new EarningService(
      mockEarningRepository as unknown as EarningRepository,
      mockBookingRepository as unknown as BookingRepository,
      mockPaymentRepository as unknown as PaymentRepository,
      mockProRepository as unknown as ProRepository
    );
  });

  describe("createEarningForCompletedBooking", () => {
    it("should create an earning for a completed booking", async () => {
      const actor = createMockActor("ADMIN");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.COMPLETED,
        proProfileId: "pro-1",
      });
      const payment = createMockPayment({
        bookingId: "booking-1",
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
        currency: "UYU",
      });
      const earning = createMockEarning();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockEarningRepository.findByBookingId.mockResolvedValue(null);
      mockPaymentRepository.findByBookingId.mockResolvedValue(payment);
      mockEarningRepository.createFromBooking.mockResolvedValue(earning);

      await service.createEarningForCompletedBooking(actor, "booking-1");

      expect(mockBookingRepository.findById).toHaveBeenCalledWith("booking-1");
      expect(mockEarningRepository.findByBookingId).toHaveBeenCalledWith("booking-1");
      expect(mockPaymentRepository.findByBookingId).toHaveBeenCalledWith("booking-1");
      expect(mockEarningRepository.createFromBooking).toHaveBeenCalledWith({
        bookingId: "booking-1",
        proProfileId: "pro-1",
        clientUserId: "client-1",
        currency: "UYU",
        grossAmount: 20000,
        platformFeeAmount: 2000, // 10% of 20000
        netAmount: 18000, // 20000 - 2000
        availableAt: expect.any(Date),
      });
    });

    it("should be idempotent if earning already exists", async () => {
      const actor = createMockActor("ADMIN");
      const booking = createMockBooking({ status: BookingStatus.COMPLETED });
      const existingEarning = createMockEarning();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockEarningRepository.findByBookingId.mockResolvedValue(existingEarning);

      await service.createEarningForCompletedBooking(actor, "booking-1");

      expect(mockEarningRepository.createFromBooking).not.toHaveBeenCalled();
    });

    it("should throw error if booking not found", async () => {
      const actor = createMockActor("ADMIN");
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(
        service.createEarningForCompletedBooking(actor, "booking-1")
      ).rejects.toThrow(BookingNotFoundError);
    });

    it("should throw error if booking is not COMPLETED", async () => {
      const actor = createMockActor("ADMIN");
      const booking = createMockBooking({
        status: BookingStatus.PENDING,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      await expect(
        service.createEarningForCompletedBooking(actor, "booking-1")
      ).rejects.toThrow(EarningCreationError);
      expect(mockEarningRepository.createFromBooking).not.toHaveBeenCalled();
    });

    it("should throw error if payment not found", async () => {
      const actor = createMockActor("ADMIN");
      const booking = createMockBooking({ status: BookingStatus.COMPLETED });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockEarningRepository.findByBookingId.mockResolvedValue(null);
      mockPaymentRepository.findByBookingId.mockResolvedValue(null);

      await expect(
        service.createEarningForCompletedBooking(actor, "booking-1")
      ).rejects.toThrow("No payment found for booking booking-1");
    });

    it("should throw error if payment is not CAPTURED", async () => {
      const actor = createMockActor("ADMIN");
      const booking = createMockBooking({ status: BookingStatus.COMPLETED });
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockEarningRepository.findByBookingId.mockResolvedValue(null);
      mockPaymentRepository.findByBookingId.mockResolvedValue(payment);

      await expect(
        service.createEarningForCompletedBooking(actor, "booking-1")
      ).rejects.toThrow("Payment for booking booking-1 must be CAPTURED");
    });

    it("should throw error if payment has no captured amount", async () => {
      const actor = createMockActor("ADMIN");
      const booking = createMockBooking({ status: BookingStatus.COMPLETED });
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
        amountCaptured: null,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockEarningRepository.findByBookingId.mockResolvedValue(null);
      mockPaymentRepository.findByBookingId.mockResolvedValue(payment);

      await expect(
        service.createEarningForCompletedBooking(actor, "booking-1")
      ).rejects.toThrow("Payment for booking booking-1 has no captured amount");
    });

    it("should throw error if booking has no proProfileId", async () => {
      const actor = createMockActor("ADMIN");
      const booking = createMockBooking({
        status: BookingStatus.COMPLETED,
        proProfileId: null,
      });
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockEarningRepository.findByBookingId.mockResolvedValue(null);
      mockPaymentRepository.findByBookingId.mockResolvedValue(payment);

      await expect(
        service.createEarningForCompletedBooking(actor, "booking-1")
      ).rejects.toThrow("Booking booking-1 has no proProfileId");
    });

    it("should work with SYSTEM actor", async () => {
      const systemActor = createMockActor("SYSTEM");
      const booking = createMockBooking({
        status: BookingStatus.COMPLETED,
        proProfileId: "pro-1",
      });
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
      });
      const earning = createMockEarning();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockEarningRepository.findByBookingId.mockResolvedValue(null);
      mockPaymentRepository.findByBookingId.mockResolvedValue(payment);
      mockEarningRepository.createFromBooking.mockResolvedValue(earning);

      await service.createEarningForCompletedBooking(systemActor, "booking-1");

      expect(mockEarningRepository.createFromBooking).toHaveBeenCalled();
    });
  });

  describe("markPayableIfDue", () => {
    it("should mark pending due earnings as payable", async () => {
      const now = new Date();
      const dueEarnings = [
        createMockEarning({
          id: "earning-1",
          status: "PENDING",
          availableAt: new Date(now.getTime() - 1000),
        }),
        createMockEarning({
          id: "earning-2",
          status: "PENDING",
          availableAt: new Date(now.getTime() - 2000),
        }),
      ];
      const updatedEarnings = [
        createMockEarning({ id: "earning-1", status: "PAYABLE" }),
        createMockEarning({ id: "earning-2", status: "PAYABLE" }),
      ];

      mockEarningRepository.listPendingDue.mockResolvedValue(dueEarnings);
      mockEarningRepository.markManyStatus.mockResolvedValue(updatedEarnings);

      const count = await service.markPayableIfDue(now);

      expect(count).toBe(2);
      expect(mockEarningRepository.listPendingDue).toHaveBeenCalledWith(now);
      expect(mockEarningRepository.markManyStatus).toHaveBeenCalledWith(
        ["earning-1", "earning-2"],
        "PAYABLE"
      );
    });

    it("should return 0 if no pending due earnings", async () => {
      const now = new Date();

      mockEarningRepository.listPendingDue.mockResolvedValue([]);

      const count = await service.markPayableIfDue(now);

      expect(count).toBe(0);
      expect(mockEarningRepository.markManyStatus).not.toHaveBeenCalled();
    });

    it("should use current date if no date provided", async () => {
      const dueEarnings = [createMockEarning({ id: "earning-1", status: "PENDING" })];

      mockEarningRepository.listPendingDue.mockResolvedValue(dueEarnings);
      mockEarningRepository.markManyStatus.mockResolvedValue([
        createMockEarning({ id: "earning-1", status: "PAYABLE" }),
      ]);

      const count = await service.markPayableIfDue();

      expect(count).toBe(1);
      expect(mockEarningRepository.listPendingDue).toHaveBeenCalled();
    });
  });
});
