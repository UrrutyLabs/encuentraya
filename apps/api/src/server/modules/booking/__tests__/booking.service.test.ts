import { describe, it, expect, beforeEach, vi } from "vitest";
import { BookingService } from "../booking.service";
import type { BookingRepository, BookingEntity } from "../booking.repo";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type { PaymentRepository, PaymentEntity } from "@modules/payment/payment.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { NotificationService } from "@modules/notification/notification.service";
import type { EarningService } from "@modules/payout/earning.service";
import type { AuditService } from "@modules/audit/audit.service";
import type { PaymentService } from "@modules/payment/payment.service";
import type { PaymentServiceFactory } from "@/server/container";
import { BookingStatus, PaymentStatus, Role, PaymentProvider, PaymentType, Category } from "@repo/domain";
import {
  InvalidBookingStateError,
  UnauthorizedBookingActionError,
  BookingNotFoundError,
} from "../booking.errors";
import type { Actor } from "@infra/auth/roles";
import { AuditEventType } from "@modules/audit/audit.repo";

describe("BookingService", () => {
  let service: BookingService;
  let mockBookingRepository: ReturnType<typeof createMockBookingRepository>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;
  let mockPaymentServiceFactory: ReturnType<typeof createMockPaymentServiceFactory>;
  let mockPaymentRepository: ReturnType<typeof createMockPaymentRepository>;
  let mockClientProfileService: ReturnType<typeof createMockClientProfileService>;
  let mockNotificationService: ReturnType<typeof createMockNotificationService>;
  let mockEarningService: ReturnType<typeof createMockEarningService>;
  let mockAuditService: ReturnType<typeof createMockAuditService>;
  let mockPaymentService: ReturnType<typeof createMockPaymentService>;

  function createMockBookingRepository(): {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByClientUserId: ReturnType<typeof vi.fn>;
    findByProProfileId: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    updateProProfileId: ReturnType<typeof vi.fn>;
    assignPro: ReturnType<typeof vi.fn>;
  } {
    return {
      create: vi.fn(),
      findById: vi.fn(),
      findByClientUserId: vi.fn(),
      findByProProfileId: vi.fn(),
      findAll: vi.fn(),
      updateStatus: vi.fn(),
      updateProProfileId: vi.fn(),
      assignPro: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findById: ReturnType<typeof vi.fn>;
    findByUserId: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
    };
  }

  function createMockPaymentServiceFactory(): PaymentServiceFactory {
    return vi.fn() as unknown as PaymentServiceFactory;
  }

  function createMockPaymentRepository(): {
    findByBookingId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByBookingId: vi.fn(),
    };
  }

  function createMockClientProfileService(): {
    ensureClientProfileExists: ReturnType<typeof vi.fn>;
    getProfile: ReturnType<typeof vi.fn>;
    getProfileByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      ensureClientProfileExists: vi.fn(),
      getProfile: vi.fn(),
      getProfileByUserId: vi.fn(),
    };
  }

  function createMockNotificationService(): {
    deliverNow: ReturnType<typeof vi.fn>;
  } {
    return {
      deliverNow: vi.fn(),
    };
  }

  function createMockEarningService(): {
    createEarningForCompletedBooking: ReturnType<typeof vi.fn>;
  } {
    return {
      createEarningForCompletedBooking: vi.fn(),
    };
  }

  function createMockAuditService(): {
    logEvent: ReturnType<typeof vi.fn>;
  } {
    return {
      logEvent: vi.fn(),
    };
  }

  function createMockPaymentService(): {
    capturePayment: ReturnType<typeof vi.fn>;
  } {
    return {
      capturePayment: vi.fn(),
    };
  }

  function createMockActor(role: Role = Role.CLIENT, id = "client-1"): Actor {
    return { id, role };
  }

  function createMockBooking(overrides?: Partial<BookingEntity>): BookingEntity {
    return {
      id: "booking-1",
      displayId: "A0002",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      category: "PLUMBING",
      status: BookingStatus.PENDING_PAYMENT,
      scheduledAt: new Date(),
      hoursEstimate: 2,
      addressText: "123 Main St",
      isFirstBooking: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockProProfile(overrides?: Partial<ProProfileEntity>): ProProfileEntity {
    return {
      id: "pro-1",
      userId: "user-1",
      displayName: "Test Pro",
      email: "pro@example.com",
      phone: null,
      bio: null,
      hourlyRate: 100,
      categories: [],
      serviceArea: null,
      status: "active",
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
      status: PaymentStatus.AUTHORIZED,
      bookingId: "booking-1",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      currency: "UYU",
      amountEstimated: 20000,
      amountAuthorized: 20000,
      amountCaptured: null,
      providerReference: "mp-ref-123",
      checkoutUrl: null,
      idempotencyKey: "booking-1-1234567890",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockClientProfile(overrides?: Partial<{
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    createdAt: Date;
    updatedAt: Date;
  }>): {
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: "profile-1",
      userId: "client-1",
      firstName: "John",
      lastName: "Doe",
      email: "client@example.com",
      phone: "+59812345678",
      preferredContactMethod: "EMAIL",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockBookingRepository = createMockBookingRepository();
    mockProRepository = createMockProRepository();
    mockPaymentServiceFactory = createMockPaymentServiceFactory();
    mockPaymentRepository = createMockPaymentRepository();
    mockClientProfileService = createMockClientProfileService();
    mockNotificationService = createMockNotificationService();
    mockEarningService = createMockEarningService();
    mockAuditService = createMockAuditService();
    mockPaymentService = createMockPaymentService();

    vi.mocked(mockPaymentServiceFactory).mockResolvedValue(
      mockPaymentService as unknown as PaymentService
    );
    vi.mocked(mockNotificationService.deliverNow).mockResolvedValue(undefined);
    vi.mocked(mockClientProfileService.getProfileByUserId).mockResolvedValue(
      createMockClientProfile()
    );

    service = new BookingService(
      mockBookingRepository as unknown as BookingRepository,
      mockProRepository as unknown as ProRepository,
      mockPaymentServiceFactory,
      mockPaymentRepository as unknown as PaymentRepository,
      mockClientProfileService as unknown as ClientProfileService,
      mockNotificationService as unknown as NotificationService,
      mockEarningService as unknown as EarningService,
      mockAuditService as unknown as AuditService
    );
  });

  describe("createBooking", () => {
    it("should create a booking successfully", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "active" });
      const booking = createMockBooking({ id: "booking-1" });
      const clientProfile = createMockClientProfile({ userId: actor.id });

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(clientProfile);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockBookingRepository.create.mockResolvedValue(booking);
      vi.mocked(mockNotificationService.deliverNow).mockResolvedValue(undefined);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: new Date(),
        estimatedHours: 2,
        description: "123 Main St",
      };

      const result = await service.createBooking(actor, input);

      expect(result.id).toBe("booking-1");
      expect(mockClientProfileService.ensureClientProfileExists).toHaveBeenCalledWith(actor.id);
      expect(mockProRepository.findById).toHaveBeenCalledWith("pro-1");
      expect(mockBookingRepository.create).toHaveBeenCalled();
      expect(mockNotificationService.deliverNow).toHaveBeenCalled();
    });

    it("should throw error if pro not found", async () => {
      const actor = createMockActor(Role.CLIENT);
      const clientProfile = createMockClientProfile({ userId: actor.id });

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(clientProfile);
      mockProRepository.findById.mockResolvedValue(null);

      await expect(
        service.createBooking(actor, {
          proId: "pro-1",
          category: Category.PLUMBING,
          scheduledAt: new Date(),
          estimatedHours: 2,
          description: "123 Main St",
        })
      ).rejects.toThrow("Pro not found");
    });

    it("should throw error if pro is suspended", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ status: "suspended" });
      const clientProfile = createMockClientProfile({ userId: actor.id });

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(clientProfile);
      mockProRepository.findById.mockResolvedValue(proProfile);

      await expect(
        service.createBooking(actor, {
          proId: "pro-1",
          category: Category.PLUMBING,
          scheduledAt: new Date(),
          estimatedHours: 2,
          description: "123 Main St",
        })
      ).rejects.toThrow("Pro is suspended");
    });
  });

  describe("acceptBooking", () => {
    it("should accept a booking as pro", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1", userId: "user-1" });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ACCEPTED,
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValueOnce(proProfile);
      vi.mocked(mockClientProfileService.getProfileByUserId).mockResolvedValue(clientProfile);

      const result = await service.acceptBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ACCEPTED);
      expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith(
        "booking-1",
        BookingStatus.ACCEPTED
      );
      expect(mockNotificationService.deliverNow).toHaveBeenCalled();
    });

    it("should accept a booking as admin", async () => {
      const actor = createMockActor(Role.ADMIN);
      const booking = createMockBooking({
        status: BookingStatus.PENDING,
      });
      const updatedBooking = createMockBooking({
        status: BookingStatus.ACCEPTED,
      });
      const proProfile = createMockProProfile();
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      vi.mocked(mockClientProfileService.getProfileByUserId).mockResolvedValue(clientProfile);

      const result = await service.acceptBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ACCEPTED);
      expect(mockProRepository.findByUserId).not.toHaveBeenCalled();
    });

    it("should throw error if booking not found", async () => {
      const actor = createMockActor(Role.PRO);
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(service.acceptBooking(actor, "booking-1")).rejects.toThrow(
        BookingNotFoundError
      );
    });

    it("should throw error if invalid state transition", async () => {
      const actor = createMockActor(Role.PRO);
      const booking = createMockBooking({
        status: BookingStatus.COMPLETED,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      await expect(service.acceptBooking(actor, "booking-1")).rejects.toThrow(
        InvalidBookingStateError
      );
    });

    it("should throw error if pro is not assigned to booking", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        status: BookingStatus.PENDING,
        proProfileId: "pro-2",
      });
      const proProfile = createMockProProfile({ id: "pro-1", userId: "user-1" });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);

      await expect(service.acceptBooking(actor, "booking-1")).rejects.toThrow(
        UnauthorizedBookingActionError
      );
    });
  });

  describe("rejectBooking", () => {
    it("should reject a booking as pro", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        status: BookingStatus.PENDING,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1", userId: "user-1" });
      const updatedBooking = createMockBooking({
        status: BookingStatus.REJECTED,
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      vi.mocked(mockClientProfileService.getProfileByUserId).mockResolvedValue(clientProfile);

      const result = await service.rejectBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.REJECTED);
      expect(mockNotificationService.deliverNow).toHaveBeenCalled();
    });
  });

  describe("markOnMyWay", () => {
    it("should mark booking as on my way", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        status: BookingStatus.ACCEPTED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1", userId: "user-1" });
      const updatedBooking = createMockBooking({
        status: BookingStatus.ON_MY_WAY,
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      vi.mocked(mockClientProfileService.getProfileByUserId).mockResolvedValue(clientProfile);

      const result = await service.markOnMyWay(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ON_MY_WAY);
      expect(mockNotificationService.deliverNow).toHaveBeenCalled();
    });
  });

  describe("arriveBooking", () => {
    it("should mark booking as arrived", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        status: BookingStatus.ON_MY_WAY,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1", userId: "user-1" });
      const updatedBooking = createMockBooking({
        status: BookingStatus.ARRIVED,
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      vi.mocked(mockClientProfileService.getProfileByUserId).mockResolvedValue(clientProfile);

      const result = await service.arriveBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ARRIVED);
      expect(mockNotificationService.deliverNow).toHaveBeenCalled();
    });
  });

  describe("cancelBooking", () => {
    it("should cancel a booking as client", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const booking = createMockBooking({
        status: BookingStatus.PENDING,
        clientUserId: "client-1",
      });
      const updatedBooking = createMockBooking({
        status: BookingStatus.CANCELLED,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);

      const result = await service.cancelBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it("should throw error if client does not own booking", async () => {
      const actor = createMockActor(Role.CLIENT, "client-2");
      const booking = createMockBooking({
        status: BookingStatus.PENDING,
        clientUserId: "client-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      await expect(service.cancelBooking(actor, "booking-1")).rejects.toThrow(
        UnauthorizedBookingActionError
      );
    });
  });

  describe("completeBooking", () => {
    it("should complete a booking and capture payment", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        status: BookingStatus.ARRIVED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1", userId: "user-1" });
      const updatedBooking = createMockBooking({
        status: BookingStatus.COMPLETED,
      });
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockPaymentRepository.findByBookingId.mockResolvedValue(payment);
      vi.mocked(mockPaymentService.capturePayment).mockResolvedValue({ capturedAmount: 20000 });
      vi.mocked(mockEarningService.createEarningForCompletedBooking).mockResolvedValue(undefined);
      mockProRepository.findById.mockResolvedValue(proProfile);
      vi.mocked(mockClientProfileService.getProfileByUserId).mockResolvedValue(clientProfile);

      const result = await service.completeBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(mockPaymentServiceFactory).toHaveBeenCalledWith(PaymentProvider.MERCADO_PAGO);
      expect(vi.mocked(mockPaymentService.capturePayment)).toHaveBeenCalledWith("payment-1");
      expect(mockEarningService.createEarningForCompletedBooking).toHaveBeenCalled();
      expect(mockNotificationService.deliverNow).toHaveBeenCalled();
    });

    it("should complete booking even if payment capture fails", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        status: BookingStatus.ARRIVED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1", userId: "user-1" });
      const updatedBooking = createMockBooking({
        status: BookingStatus.COMPLETED,
      });
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockPaymentRepository.findByBookingId.mockResolvedValue(payment);
      vi.mocked(mockPaymentService.capturePayment).mockRejectedValue(new Error("Capture failed"));
      mockProRepository.findById.mockResolvedValue(proProfile);
      vi.mocked(mockClientProfileService.getProfileByUserId).mockResolvedValue(clientProfile);

      const result = await service.completeBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(mockNotificationService.deliverNow).toHaveBeenCalled();
    });

    it("should create earning if payment already captured", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        status: BookingStatus.ARRIVED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1", userId: "user-1" });
      const updatedBooking = createMockBooking({
        status: BookingStatus.COMPLETED,
      });
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockPaymentRepository.findByBookingId.mockResolvedValue(payment);
      vi.mocked(mockEarningService.createEarningForCompletedBooking).mockResolvedValue(undefined);
      mockProRepository.findById.mockResolvedValue(proProfile);
      vi.mocked(mockClientProfileService.getProfileByUserId).mockResolvedValue(clientProfile);

      const result = await service.completeBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(mockEarningService.createEarningForCompletedBooking).toHaveBeenCalled();
    });
  });

  describe("getBookingById", () => {
    it("should get booking by ID", async () => {
      const booking = createMockBooking();
      const proProfile = createMockProProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.getBookingById("booking-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("booking-1");
    });

    it("should return null if booking not found", async () => {
      mockBookingRepository.findById.mockResolvedValue(null);

      const result = await service.getBookingById("booking-1");

      expect(result).toBeNull();
    });
  });

  describe("getRebookTemplate", () => {
    it("should get rebook template for completed booking", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const booking = createMockBooking({
        status: BookingStatus.COMPLETED,
        clientUserId: "client-1",
        proProfileId: "pro-1",
        category: "PLUMBING",
        addressText: "123 Main St",
        hoursEstimate: 2,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      const result = await service.getRebookTemplate(actor, "booking-1");

      expect(result.proProfileId).toBe("pro-1");
      expect(result.category).toBe("PLUMBING");
      expect(result.addressText).toBe("123 Main St");
      expect(result.estimatedHours).toBe(2);
    });

    it("should throw error if booking is not completed", async () => {
      const actor = createMockActor(Role.CLIENT);
      const booking = createMockBooking({
        status: BookingStatus.PENDING,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      await expect(service.getRebookTemplate(actor, "booking-1")).rejects.toThrow(
        InvalidBookingStateError
      );
    });

    it("should throw error if client does not own booking", async () => {
      const actor = createMockActor(Role.CLIENT, "client-2");
      const booking = createMockBooking({
        status: BookingStatus.COMPLETED,
        clientUserId: "client-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      await expect(service.getRebookTemplate(actor, "booking-1")).rejects.toThrow(
        UnauthorizedBookingActionError
      );
    });
  });

  describe("getClientBookings", () => {
    it("should get bookings for a client", async () => {
      const bookings = [
        createMockBooking({ id: "booking-1", proProfileId: "pro-1" }),
        createMockBooking({ id: "booking-2", proProfileId: "pro-1" }),
      ];
      const proProfile = createMockProProfile({ id: "pro-1" });

      mockBookingRepository.findByClientUserId.mockResolvedValue(bookings);
      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.getClientBookings("client-1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("booking-1");
    });
  });

  describe("getProBookings", () => {
    it("should get bookings for a pro", async () => {
      const bookings = [
        createMockBooking({ id: "booking-1" }),
        createMockBooking({ id: "booking-2" }),
      ];
      const proProfile = createMockProProfile({ id: "pro-1" });

      mockBookingRepository.findByProProfileId.mockResolvedValue(bookings);
      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.getProBookings("pro-1");

      expect(result).toHaveLength(2);
    });
  });

  describe("getProBookingsByUserId", () => {
    it("should get bookings for a pro by user ID", async () => {
      const proProfile = createMockProProfile({ id: "pro-1", userId: "user-1" });
      const bookings = [createMockBooking()];

      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockBookingRepository.findByProProfileId.mockResolvedValue(bookings);
      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.getProBookingsByUserId("user-1");

      expect(result).toHaveLength(1);
    });

    it("should return empty array if pro profile not found", async () => {
      mockProRepository.findByUserId.mockResolvedValue(null);

      const result = await service.getProBookingsByUserId("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("adminListBookings", () => {
    it("should list all bookings for admin", async () => {
      const bookings = [createMockBooking()];
      const clientProfile = createMockClientProfile();
      const proProfile = createMockProProfile();

      mockBookingRepository.findAll.mockResolvedValue(bookings);
      vi.mocked(mockClientProfileService.getProfile).mockResolvedValue(clientProfile);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockPaymentRepository.findByBookingId.mockResolvedValue(null);

      const result = await service.adminListBookings();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("booking-1");
    });

    it("should filter bookings by status", async () => {
      const bookings = [createMockBooking({ status: BookingStatus.PENDING })];
      const clientProfile = createMockClientProfile();
      const proProfile = createMockProProfile();

      mockBookingRepository.findAll.mockResolvedValue(bookings);
      vi.mocked(mockClientProfileService.getProfile).mockResolvedValue(clientProfile);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockPaymentRepository.findByBookingId.mockResolvedValue(null);

      await service.adminListBookings({ status: BookingStatus.PENDING });

      expect(mockBookingRepository.findAll).toHaveBeenCalledWith({
        status: BookingStatus.PENDING,
      });
    });
  });

  describe("adminGetBookingById", () => {
    it("should get booking by ID with full details", async () => {
      const booking = createMockBooking();
      const clientProfile = createMockClientProfile();
      const proProfile = createMockProProfile();
      const payment = createMockPayment();

      mockBookingRepository.findById.mockResolvedValue(booking);
      vi.mocked(mockClientProfileService.getProfile).mockResolvedValue(clientProfile);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockPaymentRepository.findByBookingId.mockResolvedValue(payment);

      const result = await service.adminGetBookingById("booking-1");

      expect(result.id).toBe("booking-1");
      expect(result.client.email).toBe("client@example.com");
      expect(result.pro?.displayName).toBe("Test Pro");
      expect(result.payment?.id).toBe("payment-1");
    });
  });

  describe("adminForceStatus", () => {
    it("should force update booking status as admin", async () => {
      const actor = createMockActor(Role.ADMIN);
      const booking = createMockBooking({
        status: BookingStatus.PENDING,
      });
      const updatedBooking = createMockBooking({
        status: BookingStatus.COMPLETED,
      });
      const proProfile = createMockProProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      vi.mocked(mockAuditService.logEvent).mockResolvedValue(undefined);
      mockProRepository.findById.mockResolvedValue(proProfile);

      const result = await service.adminForceStatus(
        "booking-1",
        BookingStatus.COMPLETED,
        actor
      );

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.BOOKING_STATUS_FORCED,
        actor,
        resourceType: "booking",
        resourceId: "booking-1",
        action: "force_status",
        metadata: expect.objectContaining({
          previousStatus: BookingStatus.PENDING,
          newStatus: BookingStatus.COMPLETED,
        }),
      });
    });

    it("should throw error if booking not found", async () => {
      const actor = createMockActor(Role.ADMIN);
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(
        service.adminForceStatus("booking-1", BookingStatus.COMPLETED, actor)
      ).rejects.toThrow(BookingNotFoundError);
    });
  });
});
