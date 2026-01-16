import { describe, it, expect, beforeEach, vi } from "vitest";
import { BookingCreationService } from "../booking.creation.service";
import type { BookingRepository, BookingEntity } from "../booking.repo";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { NotificationService } from "@modules/notification/notification.service";
import { BookingStatus, Role, Category } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import * as bookingHelpers from "../booking.helpers";
import * as displayIdModule from "../booking.display-id";

// Mock the container to prevent initialization errors
vi.mock("@/server/container", () => ({
  container: {
    resolve: vi.fn(),
  },
  TOKENS: {
    BookingRepository: Symbol("BookingRepository"),
    ProRepository: Symbol("ProRepository"),
    ClientProfileService: Symbol("ClientProfileService"),
    NotificationService: Symbol("NotificationService"),
    BookingCreationService: Symbol("BookingCreationService"),
  },
}));

describe("BookingCreationService", () => {
  let service: BookingCreationService;
  let mockBookingRepository: ReturnType<typeof createMockBookingRepository>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;
  let mockClientProfileService: ReturnType<typeof createMockClientProfileService>;
  let mockNotificationService: ReturnType<typeof createMockNotificationService>;

  function createMockBookingRepository(): {
    create: ReturnType<typeof vi.fn>;
    findByClientUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      create: vi.fn(),
      findByClientUserId: vi.fn().mockResolvedValue([]),
    };
  }

  function createMockProRepository(): {
    findById: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
    };
  }

  function createMockClientProfileService(): {
    ensureClientProfileExists: ReturnType<typeof vi.fn>;
  } {
    return {
      ensureClientProfileExists: vi.fn().mockResolvedValue(undefined),
    };
  }

  function createMockNotificationService(): {
    deliverNow: ReturnType<typeof vi.fn>;
  } {
    return {
      deliverNow: vi.fn().mockResolvedValue(undefined),
    };
  }

  function createMockActor(role: Role = Role.CLIENT, id = "client-1"): Actor {
    return { id, role };
  }

  function createMockProProfile(overrides?: Partial<ProProfileEntity>): ProProfileEntity {
    return {
      id: "pro-1",
      userId: "user-1",
      displayName: "Test Pro",
      email: "pro@example.com",
      phone: "+1234567890",
      bio: "Test bio",
      hourlyRate: 100,
      categories: ["plumbing"],
      serviceArea: "Test Area",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockBooking(overrides?: Partial<BookingEntity>): BookingEntity {
    return {
      id: "booking-1",
      displayId: "A0002",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      category: "plumbing",
      status: BookingStatus.PENDING,
      scheduledAt: new Date(),
      hoursEstimate: 2,
      addressText: "123 Main St",
      isFirstBooking: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockBookingRepository = createMockBookingRepository();
    mockProRepository = createMockProRepository();
    mockClientProfileService = createMockClientProfileService();
    mockNotificationService = createMockNotificationService();

    // Mock helper functions
    vi.spyOn(bookingHelpers, "sendClientNotification").mockResolvedValue(undefined);
    vi.spyOn(bookingHelpers, "adaptToDomain").mockImplementation((booking, input, hourlyRate) => ({
      id: booking.id,
      clientId: booking.clientUserId,
      proId: booking.proProfileId || input.proId,
      category: input.category,
      description: booking.addressText,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      completedAt: undefined,
      cancelledAt: undefined,
      hourlyRate,
      estimatedHours: booking.hoursEstimate,
      totalAmount: hourlyRate * booking.hoursEstimate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    // Mock displayId generation
    vi.spyOn(displayIdModule, "getNextDisplayId").mockResolvedValue("A0002");

    service = new BookingCreationService(
      mockBookingRepository as unknown as BookingRepository,
      mockProRepository as unknown as ProRepository,
      mockClientProfileService as unknown as ClientProfileService,
      mockNotificationService as unknown as NotificationService
    );

    vi.clearAllMocks();
    mockClientProfileService.ensureClientProfileExists.mockResolvedValue(undefined);
    vi.mocked(bookingHelpers.sendClientNotification).mockResolvedValue(undefined);
    vi.mocked(displayIdModule.getNextDisplayId).mockResolvedValue("A0002");
  });

  describe("createBooking", () => {
    it("should create a booking successfully with future date", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "active" });
      const booking = createMockBooking({ id: "booking-1" });
      
      // Future date (tomorrow at 10:00)
      const futureDate = new Date();
      futureDate.setUTCDate(futureDate.getUTCDate() + 1);
      futureDate.setUTCHours(10, 0, 0, 0);

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockBookingRepository.create.mockResolvedValue(booking);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: futureDate,
        estimatedHours: 2,
        description: "123 Main St",
      };

      const result = await service.createBooking(actor, input);

      expect(result.id).toBe("booking-1");
      expect(mockClientProfileService.ensureClientProfileExists).toHaveBeenCalledWith(actor.id);
      expect(mockProRepository.findById).toHaveBeenCalledWith("pro-1");
      expect(mockBookingRepository.create).toHaveBeenCalled();
      expect(bookingHelpers.sendClientNotification).toHaveBeenCalled();
    });

    it("should create a booking successfully with today's date and future time", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "active" });
      const booking = createMockBooking({ id: "booking-1" });
      
      // Today at 15:00 (future time)
      const today = new Date();
      today.setUTCHours(15, 0, 0, 0);
      // Set current time to 10:00 to ensure scheduled time is in the future
      vi.useFakeTimers();
      vi.setSystemTime(new Date(today.getTime() - 5 * 60 * 60 * 1000)); // 5 hours earlier

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockBookingRepository.create.mockResolvedValue(booking);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: today,
        estimatedHours: 2,
        description: "123 Main St",
      };

      const result = await service.createBooking(actor, input);

      expect(result.id).toBe("booking-1");
      expect(mockBookingRepository.create).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should throw error if time is not at hour or half-hour", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "active" });
      
      // Future date at 10:15 (invalid - not hour or half-hour)
      const futureDate = new Date();
      futureDate.setUTCDate(futureDate.getUTCDate() + 1);
      futureDate.setUTCHours(10, 15, 0, 0);

      mockProRepository.findById.mockResolvedValue(proProfile);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: futureDate,
        estimatedHours: 2,
        description: "123 Main St",
      };

      await expect(service.createBooking(actor, input)).rejects.toThrow(
        "Booking time must be at the hour or half-hour (e.g., 13:00 or 13:30)"
      );
    });

    it("should throw error if scheduled date is in the past", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "active" });
      
      // Yesterday at 10:00
      const pastDate = new Date();
      pastDate.setUTCDate(pastDate.getUTCDate() - 1);
      pastDate.setUTCHours(10, 0, 0, 0);

      mockProRepository.findById.mockResolvedValue(proProfile);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: pastDate,
        estimatedHours: 2,
        description: "123 Main St",
      };

      await expect(service.createBooking(actor, input)).rejects.toThrow(
        "Cannot create booking for dates in the past"
      );
    });

    it("should throw error if scheduled time is in the past (today)", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "active" });
      
      // Today at 10:00, but current time is 12:00
      const today = new Date();
      today.setUTCHours(10, 0, 0, 0);
      
      vi.useFakeTimers();
      const currentTime = new Date(today);
      currentTime.setUTCHours(12, 0, 0, 0);
      vi.setSystemTime(currentTime);

      mockProRepository.findById.mockResolvedValue(proProfile);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: today,
        estimatedHours: 2,
        description: "123 Main St",
      };

      await expect(service.createBooking(actor, input)).rejects.toThrow(
        "Cannot create booking for times in the past"
      );

      vi.useRealTimers();
    });

    it("should accept booking for today if time is exactly now (edge case)", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "active" });
      const booking = createMockBooking({ id: "booking-1" });
      
      // Set current time to 10:00:00
      vi.useFakeTimers();
      const now = new Date();
      now.setUTCHours(10, 0, 0, 0);
      vi.setSystemTime(now);

      // Scheduled time is 10:00:01 (1ms in the future)
      const scheduledTime = new Date(now.getTime() + 1);

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockBookingRepository.create.mockResolvedValue(booking);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: scheduledTime,
        estimatedHours: 2,
        description: "123 Main St",
      };

      const result = await service.createBooking(actor, input);

      expect(result.id).toBe("booking-1");
      expect(mockBookingRepository.create).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should throw error if pro not found", async () => {
      const actor = createMockActor(Role.CLIENT);
      
      const futureDate = new Date();
      futureDate.setUTCDate(futureDate.getUTCDate() + 1);
      futureDate.setUTCHours(10, 0, 0, 0);

      mockProRepository.findById.mockResolvedValue(null);

      const input = {
        proId: "non-existent",
        category: Category.PLUMBING,
        scheduledAt: futureDate,
        estimatedHours: 2,
        description: "123 Main St",
      };

      await expect(service.createBooking(actor, input)).rejects.toThrow("Pro not found");
    });

    it("should throw error if pro is suspended", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "suspended" });
      
      const futureDate = new Date();
      futureDate.setUTCDate(futureDate.getUTCDate() + 1);
      futureDate.setUTCHours(10, 0, 0, 0);

      mockProRepository.findById.mockResolvedValue(proProfile);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: futureDate,
        estimatedHours: 2,
        description: "123 Main St",
      };

      await expect(service.createBooking(actor, input)).rejects.toThrow("Pro is suspended");
    });

    it("should accept time at hour (00 minutes)", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "active" });
      const booking = createMockBooking({ id: "booking-1" });
      
      const futureDate = new Date();
      futureDate.setUTCDate(futureDate.getUTCDate() + 1);
      futureDate.setUTCHours(13, 0, 0, 0); // 13:00

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockBookingRepository.create.mockResolvedValue(booking);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: futureDate,
        estimatedHours: 2,
        description: "123 Main St",
      };

      const result = await service.createBooking(actor, input);

      expect(result.id).toBe("booking-1");
      expect(mockBookingRepository.create).toHaveBeenCalled();
      expect(bookingHelpers.sendClientNotification).toHaveBeenCalled();
    });

    it("should accept time at half-hour (30 minutes)", async () => {
      const actor = createMockActor(Role.CLIENT);
      const proProfile = createMockProProfile({ id: "pro-1", status: "active" });
      const booking = createMockBooking({ id: "booking-1" });
      
      const futureDate = new Date();
      futureDate.setUTCDate(futureDate.getUTCDate() + 1);
      futureDate.setUTCHours(13, 30, 0, 0); // 13:30

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockBookingRepository.create.mockResolvedValue(booking);

      const input = {
        proId: "pro-1",
        category: Category.PLUMBING,
        scheduledAt: futureDate,
        estimatedHours: 2,
        description: "123 Main St",
      };

      const result = await service.createBooking(actor, input);

      expect(result.id).toBe("booking-1");
      expect(mockBookingRepository.create).toHaveBeenCalled();
      expect(bookingHelpers.sendClientNotification).toHaveBeenCalled();
    });
  });
});
