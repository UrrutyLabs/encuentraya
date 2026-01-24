import { describe, it, expect, beforeEach, vi } from "vitest";
import { BookingLifecycleService } from "../booking.lifecycle.service";
import type { BookingRepository, BookingEntity } from "../booking.repo";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { NotificationService } from "@modules/notification/notification.service";
import { BookingStatus, Role } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import * as bookingHelpers from "../booking.helpers";
import {
  InvalidBookingStateError,
  UnauthorizedBookingActionError,
  BookingNotFoundError,
} from "../booking.errors";

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
    BookingLifecycleService: Symbol("BookingLifecycleService"),
  },
}));

describe("BookingLifecycleService", () => {
  let service: BookingLifecycleService;
  let mockBookingRepository: ReturnType<typeof createMockBookingRepository>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;
  let mockClientProfileService: ReturnType<
    typeof createMockClientProfileService
  >;
  let mockNotificationService: ReturnType<typeof createMockNotificationService>;

  function createMockBookingRepository(): {
    findById: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findById: ReturnType<typeof vi.fn>;
    findByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
      findByUserId: vi.fn(),
    };
  }

  function createMockClientProfileService(): {
    getProfileByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
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

  function createMockActor(role: Role = Role.CLIENT, id = "user-1"): Actor {
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

  function createMockBooking(
    overrides?: Partial<BookingEntity>
  ): BookingEntity {
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

  function createMockClientProfile(
    overrides?: Partial<{
      id: string;
      userId: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
      preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  ): {
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
      id: "client-profile-1",
      userId: "client-1",
      firstName: "John",
      lastName: "Doe",
      email: "client@example.com",
      phone: "+1234567890",
      preferredContactMethod: "EMAIL",
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
    vi.spyOn(bookingHelpers, "sendClientNotification").mockResolvedValue(
      undefined
    );
    vi.spyOn(bookingHelpers, "validateStateTransition").mockImplementation(
      () => {}
    );
    vi.spyOn(bookingHelpers, "authorizeProAction").mockResolvedValue(undefined);
    vi.spyOn(bookingHelpers, "authorizeClientAction").mockImplementation(
      () => {}
    );

    service = new BookingLifecycleService(
      mockBookingRepository as unknown as BookingRepository,
      mockProRepository as unknown as ProRepository,
      mockClientProfileService as unknown as ClientProfileService,
      mockNotificationService as unknown as NotificationService
    );

    vi.clearAllMocks();
  });

  describe("acceptBooking", () => {
    it("should accept a booking as pro", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        proProfileId: "pro-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ACCEPTED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "user-1",
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockClientProfileService.getProfileByUserId.mockResolvedValue(
        clientProfile
      );

      const result = await service.acceptBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ACCEPTED);
      expect(mockBookingRepository.findById).toHaveBeenCalledWith("booking-1");
      expect(bookingHelpers.validateStateTransition).toHaveBeenCalledWith(
        BookingStatus.PENDING,
        BookingStatus.ACCEPTED
      );
      expect(bookingHelpers.authorizeProAction).toHaveBeenCalled();
      expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith(
        "booking-1",
        BookingStatus.ACCEPTED
      );
      expect(bookingHelpers.sendClientNotification).toHaveBeenCalled();
    });

    it("should accept a booking as admin", async () => {
      const actor = createMockActor(Role.ADMIN);
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        proProfileId: "pro-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ACCEPTED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1" });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockClientProfileService.getProfileByUserId.mockResolvedValue(
        clientProfile
      );

      const result = await service.acceptBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ACCEPTED);
      expect(bookingHelpers.authorizeProAction).toHaveBeenCalled();
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
        id: "booking-1",
        status: BookingStatus.COMPLETED,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      vi.mocked(bookingHelpers.validateStateTransition).mockImplementation(
        () => {
          throw new InvalidBookingStateError(
            BookingStatus.COMPLETED,
            BookingStatus.ACCEPTED
          );
        }
      );

      await expect(service.acceptBooking(actor, "booking-1")).rejects.toThrow(
        InvalidBookingStateError
      );
    });

    it("should throw error if pro is not authorized", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        proProfileId: "pro-2",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      vi.mocked(bookingHelpers.authorizeProAction).mockRejectedValue(
        new UnauthorizedBookingActionError("accept booking", "Not authorized")
      );

      await expect(service.acceptBooking(actor, "booking-1")).rejects.toThrow(
        UnauthorizedBookingActionError
      );
    });

    it("should throw error if updateStatus returns null", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        proProfileId: "pro-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(null);

      await expect(service.acceptBooking(actor, "booking-1")).rejects.toThrow(
        BookingNotFoundError
      );
    });
  });

  describe("rejectBooking", () => {
    it("should reject a booking as pro", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        proProfileId: "pro-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.REJECTED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "user-1",
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockClientProfileService.getProfileByUserId.mockResolvedValue(
        clientProfile
      );

      const result = await service.rejectBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.REJECTED);
      expect(bookingHelpers.validateStateTransition).toHaveBeenCalledWith(
        BookingStatus.PENDING,
        BookingStatus.REJECTED
      );
      expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith(
        "booking-1",
        BookingStatus.REJECTED
      );
      expect(bookingHelpers.sendClientNotification).toHaveBeenCalled();
    });

    it("should reject a booking as admin", async () => {
      const actor = createMockActor(Role.ADMIN);
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        proProfileId: "pro-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.REJECTED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1" });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockClientProfileService.getProfileByUserId.mockResolvedValue(
        clientProfile
      );

      const result = await service.rejectBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.REJECTED);
    });

    it("should throw error if booking not found", async () => {
      const actor = createMockActor(Role.PRO);
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(service.rejectBooking(actor, "booking-1")).rejects.toThrow(
        BookingNotFoundError
      );
    });

    it("should throw error if invalid state transition", async () => {
      const actor = createMockActor(Role.PRO);
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.COMPLETED,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      vi.mocked(bookingHelpers.validateStateTransition).mockImplementation(
        () => {
          throw new InvalidBookingStateError(
            BookingStatus.COMPLETED,
            BookingStatus.REJECTED
          );
        }
      );

      await expect(service.rejectBooking(actor, "booking-1")).rejects.toThrow(
        InvalidBookingStateError
      );
    });

    it("should throw error if updateStatus returns null", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        proProfileId: "pro-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(null);

      await expect(service.rejectBooking(actor, "booking-1")).rejects.toThrow(
        BookingNotFoundError
      );
    });
  });

  describe("markOnMyWay", () => {
    it("should mark booking as on my way as pro", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ACCEPTED,
        proProfileId: "pro-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ON_MY_WAY,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "user-1",
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockClientProfileService.getProfileByUserId.mockResolvedValue(
        clientProfile
      );

      const result = await service.markOnMyWay(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ON_MY_WAY);
      expect(bookingHelpers.validateStateTransition).toHaveBeenCalledWith(
        BookingStatus.ACCEPTED,
        BookingStatus.ON_MY_WAY
      );
      expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith(
        "booking-1",
        BookingStatus.ON_MY_WAY
      );
      expect(bookingHelpers.sendClientNotification).toHaveBeenCalled();
    });

    it("should mark booking as on my way as admin", async () => {
      const actor = createMockActor(Role.ADMIN);
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ACCEPTED,
        proProfileId: "pro-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ON_MY_WAY,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1" });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockClientProfileService.getProfileByUserId.mockResolvedValue(
        clientProfile
      );

      const result = await service.markOnMyWay(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ON_MY_WAY);
    });

    it("should throw error if booking not found", async () => {
      const actor = createMockActor(Role.PRO);
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(service.markOnMyWay(actor, "booking-1")).rejects.toThrow(
        BookingNotFoundError
      );
    });

    it("should throw error if invalid state transition", async () => {
      const actor = createMockActor(Role.PRO);
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      vi.mocked(bookingHelpers.validateStateTransition).mockImplementation(
        () => {
          throw new InvalidBookingStateError(
            BookingStatus.PENDING,
            BookingStatus.ON_MY_WAY
          );
        }
      );

      await expect(service.markOnMyWay(actor, "booking-1")).rejects.toThrow(
        InvalidBookingStateError
      );
    });

    it("should throw error if updateStatus returns null", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ACCEPTED,
        proProfileId: "pro-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(null);

      await expect(service.markOnMyWay(actor, "booking-1")).rejects.toThrow(
        "Failed to update booking status"
      );
    });
  });

  describe("arriveBooking", () => {
    it("should mark booking as arrived as pro", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ON_MY_WAY,
        proProfileId: "pro-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ARRIVED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "user-1",
      });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockClientProfileService.getProfileByUserId.mockResolvedValue(
        clientProfile
      );

      const result = await service.arriveBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ARRIVED);
      expect(bookingHelpers.validateStateTransition).toHaveBeenCalledWith(
        BookingStatus.ON_MY_WAY,
        BookingStatus.ARRIVED
      );
      expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith(
        "booking-1",
        BookingStatus.ARRIVED
      );
      expect(bookingHelpers.sendClientNotification).toHaveBeenCalled();
    });

    it("should mark booking as arrived as admin", async () => {
      const actor = createMockActor(Role.ADMIN);
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ON_MY_WAY,
        proProfileId: "pro-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ARRIVED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({ id: "pro-1" });
      const clientProfile = createMockClientProfile();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockClientProfileService.getProfileByUserId.mockResolvedValue(
        clientProfile
      );

      const result = await service.arriveBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.ARRIVED);
    });

    it("should throw error if booking not found", async () => {
      const actor = createMockActor(Role.PRO);
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(service.arriveBooking(actor, "booking-1")).rejects.toThrow(
        BookingNotFoundError
      );
    });

    it("should throw error if invalid state transition", async () => {
      const actor = createMockActor(Role.PRO);
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      vi.mocked(bookingHelpers.validateStateTransition).mockImplementation(
        () => {
          throw new InvalidBookingStateError(
            BookingStatus.PENDING,
            BookingStatus.ARRIVED
          );
        }
      );

      await expect(service.arriveBooking(actor, "booking-1")).rejects.toThrow(
        InvalidBookingStateError
      );
    });

    it("should throw error if updateStatus returns null", async () => {
      const actor = createMockActor(Role.PRO, "user-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ON_MY_WAY,
        proProfileId: "pro-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(null);

      await expect(service.arriveBooking(actor, "booking-1")).rejects.toThrow(
        BookingNotFoundError
      );
    });
  });

  describe("cancelBooking", () => {
    it("should cancel a booking as client", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        clientUserId: "client-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.CANCELLED,
        clientUserId: "client-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);

      const result = await service.cancelBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(bookingHelpers.validateStateTransition).toHaveBeenCalledWith(
        BookingStatus.PENDING,
        BookingStatus.CANCELLED
      );
      expect(bookingHelpers.authorizeClientAction).toHaveBeenCalled();
      expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith(
        "booking-1",
        BookingStatus.CANCELLED
      );
    });

    it("should cancel a booking as admin", async () => {
      const actor = createMockActor(Role.ADMIN);
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ACCEPTED,
        clientUserId: "client-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.CANCELLED,
        clientUserId: "client-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);

      const result = await service.cancelBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(bookingHelpers.authorizeClientAction).toHaveBeenCalled();
    });

    it("should cancel an accepted booking as client", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.ACCEPTED,
        clientUserId: "client-1",
      });
      const updatedBooking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.CANCELLED,
        clientUserId: "client-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(updatedBooking);

      const result = await service.cancelBooking(actor, "booking-1");

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(bookingHelpers.validateStateTransition).toHaveBeenCalledWith(
        BookingStatus.ACCEPTED,
        BookingStatus.CANCELLED
      );
    });

    it("should throw error if booking not found", async () => {
      const actor = createMockActor(Role.CLIENT);
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(service.cancelBooking(actor, "booking-1")).rejects.toThrow(
        BookingNotFoundError
      );
    });

    it("should throw error if invalid state transition", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.COMPLETED,
        clientUserId: "client-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      vi.mocked(bookingHelpers.validateStateTransition).mockImplementation(
        () => {
          throw new InvalidBookingStateError(
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED
          );
        }
      );

      await expect(service.cancelBooking(actor, "booking-1")).rejects.toThrow(
        InvalidBookingStateError
      );
    });

    it("should throw error if client is not authorized", async () => {
      const actor = createMockActor(Role.CLIENT, "client-2");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        clientUserId: "client-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      vi.mocked(bookingHelpers.authorizeClientAction).mockImplementation(() => {
        throw new UnauthorizedBookingActionError(
          "cancel booking",
          "Not authorized"
        );
      });

      await expect(service.cancelBooking(actor, "booking-1")).rejects.toThrow(
        UnauthorizedBookingActionError
      );
    });

    it("should throw error if updateStatus returns null", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const booking = createMockBooking({
        id: "booking-1",
        status: BookingStatus.PENDING,
        clientUserId: "client-1",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.updateStatus.mockResolvedValue(null);

      await expect(service.cancelBooking(actor, "booking-1")).rejects.toThrow(
        BookingNotFoundError
      );
    });
  });
});
