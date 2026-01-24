import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReviewService } from "../review.service";
import type { ReviewRepository } from "../review.repo";
import type { BookingRepository } from "@modules/booking/booking.repo";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type { ReviewCreateInput } from "@repo/domain";
import { BookingStatus, Role } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { BookingNotFoundError } from "@modules/booking/booking.errors";
import {
  BookingNotCompletedError,
  ReviewAlreadyExistsError,
  UnauthorizedReviewError,
} from "../review.errors";

describe("ReviewService", () => {
  let service: ReviewService;
  let mockReviewRepository: ReturnType<typeof createMockReviewRepository>;
  let mockBookingRepository: ReturnType<typeof createMockBookingRepository>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;

  function createMockReviewRepository(): {
    create: ReturnType<typeof vi.fn>;
    findByBookingId: ReturnType<typeof vi.fn>;
    findByBookingIds: ReturnType<typeof vi.fn>;
    listForPro: ReturnType<typeof vi.fn>;
  } {
    return {
      create: vi.fn(),
      findByBookingId: vi.fn(),
      findByBookingIds: vi.fn(),
      listForPro: vi.fn(),
    };
  }

  function createMockBookingRepository(): {
    findById: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByUserId: vi.fn(),
    };
  }

  function createMockActor(role: Role = Role.CLIENT, id = "client-1"): Actor {
    return { id, role };
  }

  function createMockBooking(
    overrides?: Partial<{
      id: string;
      clientUserId: string;
      proProfileId: string | null;
      status: BookingStatus;
    }>
  ) {
    return {
      id: "booking-1",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      category: "PLUMBING",
      status: BookingStatus.COMPLETED,
      scheduledAt: new Date(),
      hoursEstimate: 2,
      addressText: "123 Main St",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockReview(
    overrides?: Partial<{
      id: string;
      bookingId: string;
      rating: number;
      comment: string | null;
    }>
  ) {
    return {
      id: "review-1",
      bookingId: "booking-1",
      rating: 4,
      comment: "Great service!",
      createdAt: new Date(),
      ...overrides,
    };
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
      hourlyRate: 100,
      categories: [],
      serviceArea: null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockReviewRepository = createMockReviewRepository();
    mockBookingRepository = createMockBookingRepository();
    mockProRepository = createMockProRepository();
    service = new ReviewService(
      mockReviewRepository as unknown as ReviewRepository,
      mockBookingRepository as unknown as BookingRepository,
      mockProRepository as unknown as ProRepository
    );
  });

  describe("createReview", () => {
    it("should create review for completed booking", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        bookingId: "booking-1",
        rating: 4,
        comment: "Great service!",
      };
      const booking = createMockBooking({
        id: input.bookingId,
        clientUserId: actor.id,
        status: BookingStatus.COMPLETED,
      });
      const review = createMockReview({
        bookingId: input.bookingId,
        rating: input.rating,
        comment: input.comment,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockReviewRepository.findByBookingId.mockResolvedValue(null);
      mockReviewRepository.create.mockResolvedValue(review);

      // Act
      const result = await service.createReview(actor, input);

      // Assert
      expect(mockBookingRepository.findById).toHaveBeenCalledWith(
        input.bookingId
      );
      expect(mockReviewRepository.findByBookingId).toHaveBeenCalledWith(
        input.bookingId
      );
      expect(mockReviewRepository.create).toHaveBeenCalledWith({
        bookingId: input.bookingId,
        proProfileId: booking.proProfileId,
        clientUserId: booking.clientUserId,
        rating: input.rating,
        comment: input.comment,
      });
      expect(result).toMatchObject({
        id: review.id,
        bookingId: review.bookingId,
        rating: review.rating,
        comment: review.comment,
        createdAt: expect.any(Date),
      });
    });

    it("should throw UnauthorizedReviewError when actor is not a client", async () => {
      // Arrange
      const actor = createMockActor(Role.PRO, "pro-1");
      const input: ReviewCreateInput = {
        bookingId: "booking-1",
        rating: 4,
      };

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        UnauthorizedReviewError
      );
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Only clients can create reviews"
      );
      expect(mockBookingRepository.findById).not.toHaveBeenCalled();
    });

    it("should throw error when rating is less than 1", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT);
      const input: ReviewCreateInput = {
        bookingId: "booking-1",
        rating: 0,
      };

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Rating must be between 1 and 5"
      );
    });

    it("should throw error when rating is greater than 5", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT);
      const input: ReviewCreateInput = {
        bookingId: "booking-1",
        rating: 6,
      };

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Rating must be between 1 and 5"
      );
    });

    it("should throw BookingNotFoundError when booking does not exist", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT);
      const input: ReviewCreateInput = {
        bookingId: "non-existent",
        rating: 4,
      };

      mockBookingRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        BookingNotFoundError
      );
    });

    it("should throw UnauthorizedReviewError when booking does not belong to client", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        bookingId: "booking-1",
        rating: 4,
      };
      const booking = createMockBooking({
        clientUserId: "different-client",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        UnauthorizedReviewError
      );
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Booking does not belong to this client"
      );
    });

    it("should throw BookingNotCompletedError when booking is not completed", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        bookingId: "booking-1",
        rating: 4,
      };
      const booking = createMockBooking({
        clientUserId: actor.id,
        status: BookingStatus.PENDING,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        BookingNotCompletedError
      );
    });

    it("should throw error when booking has no pro assigned", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        bookingId: "booking-1",
        rating: 4,
      };
      const booking = createMockBooking({
        clientUserId: actor.id,
        status: BookingStatus.COMPLETED,
        proProfileId: null,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Booking must have a pro assigned to be reviewed"
      );
    });

    it("should throw ReviewAlreadyExistsError when review already exists", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        bookingId: "booking-1",
        rating: 4,
      };
      const booking = createMockBooking({
        clientUserId: actor.id,
        status: BookingStatus.COMPLETED,
      });
      const existingReview = createMockReview();

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockReviewRepository.findByBookingId.mockResolvedValue(existingReview);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        ReviewAlreadyExistsError
      );
      expect(mockReviewRepository.create).not.toHaveBeenCalled();
    });

    it("should create review without comment when comment is not provided", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        bookingId: "booking-1",
        rating: 5,
        // No comment
      };
      const booking = createMockBooking({
        clientUserId: actor.id,
        status: BookingStatus.COMPLETED,
      });
      const review = createMockReview({
        rating: 5,
        comment: null,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockReviewRepository.findByBookingId.mockResolvedValue(null);
      mockReviewRepository.create.mockResolvedValue(review);

      // Act
      const result = await service.createReview(actor, input);

      // Assert
      expect(mockReviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: undefined,
        })
      );
      expect(result.comment).toBeNull();
    });
  });

  describe("getByBookingId", () => {
    it("should return review when client views their own booking review", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const bookingId = "booking-1";
      const booking = createMockBooking({
        id: bookingId,
        clientUserId: actor.id,
      });
      const review = createMockReview({ bookingId });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockReviewRepository.findByBookingId.mockResolvedValue(review);

      // Act
      const result = await service.getByBookingId(actor, bookingId);

      // Assert
      expect(result).toMatchObject({
        id: review.id,
        bookingId: review.bookingId,
        rating: review.rating,
        comment: review.comment,
        createdAt: expect.any(Date),
      });
    });

    it("should return null when review does not exist yet", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const bookingId = "booking-1";
      const booking = createMockBooking({
        id: bookingId,
        clientUserId: actor.id,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockReviewRepository.findByBookingId.mockResolvedValue(null);

      // Act
      const result = await service.getByBookingId(actor, bookingId);

      // Assert
      expect(result).toBeNull();
    });

    it("should allow admin to view any review", async () => {
      // Arrange
      const actor = createMockActor(Role.ADMIN, "admin-1");
      const bookingId = "booking-1";
      const booking = createMockBooking({ id: bookingId });
      const review = createMockReview({ bookingId });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockReviewRepository.findByBookingId.mockResolvedValue(review);

      // Act
      const result = await service.getByBookingId(actor, bookingId);

      // Assert
      expect(result).not.toBeNull();
      expect(mockProRepository.findByUserId).not.toHaveBeenCalled();
    });

    it("should allow pro to view review for their assigned booking", async () => {
      // Arrange
      const actor = createMockActor(Role.PRO, "pro-1");
      const bookingId = "booking-1";
      const booking = createMockBooking({
        id: bookingId,
        proProfileId: "pro-1",
      });
      const review = createMockReview({ bookingId });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: actor.id,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockReviewRepository.findByBookingId.mockResolvedValue(review);

      // Act
      const result = await service.getByBookingId(actor, bookingId);

      // Assert
      expect(result).not.toBeNull();
      expect(mockProRepository.findByUserId).toHaveBeenCalledWith(actor.id);
    });

    it("should throw UnauthorizedReviewError when client tries to view another client's review", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const bookingId = "booking-1";
      const booking = createMockBooking({
        id: bookingId,
        clientUserId: "different-client",
      });

      mockBookingRepository.findById.mockResolvedValue(booking);

      // Act & Assert
      await expect(service.getByBookingId(actor, bookingId)).rejects.toThrow(
        UnauthorizedReviewError
      );
    });

    it("should throw UnauthorizedReviewError when pro tries to view review for unassigned booking", async () => {
      // Arrange
      const actor = createMockActor(Role.PRO, "pro-1");
      const bookingId = "booking-1";
      const booking = createMockBooking({
        id: bookingId,
        proProfileId: "different-pro",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: actor.id,
      });

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);

      // Act & Assert
      await expect(service.getByBookingId(actor, bookingId)).rejects.toThrow(
        UnauthorizedReviewError
      );
    });

    it("should throw BookingNotFoundError when booking does not exist", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT);
      const bookingId = "non-existent";

      mockBookingRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getByBookingId(actor, bookingId)).rejects.toThrow(
        BookingNotFoundError
      );
    });
  });

  describe("listForPro", () => {
    it("should return reviews for a pro", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const reviews = [
        createMockReview({ id: "review-1", rating: 5 }),
        createMockReview({ id: "review-2", rating: 4 }),
      ];

      mockReviewRepository.listForPro.mockResolvedValue(reviews);

      // Act
      const result = await service.listForPro(proProfileId);

      // Assert
      expect(mockReviewRepository.listForPro).toHaveBeenCalledWith(
        proProfileId,
        undefined,
        undefined
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "review-1",
        rating: 5,
        createdAt: expect.any(Date),
      });
    });

    it("should pass limit and cursor to repository", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const limit = 10;
      const cursor = "cursor-123";

      mockReviewRepository.listForPro.mockResolvedValue([]);

      // Act
      await service.listForPro(proProfileId, limit, cursor);

      // Assert
      expect(mockReviewRepository.listForPro).toHaveBeenCalledWith(
        proProfileId,
        limit,
        cursor
      );
    });

    it("should return empty array when pro has no reviews", async () => {
      // Arrange
      const proProfileId = "pro-1";

      mockReviewRepository.listForPro.mockResolvedValue([]);

      // Act
      const result = await service.listForPro(proProfileId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("getReviewStatusByBookingIds", () => {
    it("should return status map for multiple bookings", async () => {
      // Arrange
      const bookingIds = ["booking-1", "booking-2", "booking-3"];
      const reviews = [
        createMockReview({ bookingId: "booking-1" }),
        createMockReview({ bookingId: "booking-3" }),
      ];

      mockReviewRepository.findByBookingIds.mockResolvedValue(reviews);

      // Act
      const result = await service.getReviewStatusByBookingIds(bookingIds);

      // Assert
      expect(mockReviewRepository.findByBookingIds).toHaveBeenCalledWith(
        bookingIds
      );
      expect(result).toEqual({
        "booking-1": true,
        "booking-2": false,
        "booking-3": true,
      });
    });

    it("should return empty object when no booking IDs provided", async () => {
      // Arrange
      mockReviewRepository.findByBookingIds.mockResolvedValue([]);

      // Act
      const result = await service.getReviewStatusByBookingIds([]);

      // Assert
      expect(result).toEqual({});
      expect(mockReviewRepository.findByBookingIds).not.toHaveBeenCalled();
    });

    it("should return all false when no reviews exist", async () => {
      // Arrange
      const bookingIds = ["booking-1", "booking-2"];

      mockReviewRepository.findByBookingIds.mockResolvedValue([]);

      // Act
      const result = await service.getReviewStatusByBookingIds(bookingIds);

      // Assert
      expect(result).toEqual({
        "booking-1": false,
        "booking-2": false,
      });
    });
  });
});
