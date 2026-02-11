import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchService } from "../search.service";
import type { ProService } from "@modules/pro/pro.service";
import type { AvailabilityService } from "@modules/pro/availability.service";
import type { SearchCategoryRepository } from "../searchCategory.repo";
import type { Pro } from "@repo/domain";

describe("SearchService", () => {
  let service: SearchService;
  let mockProService: ReturnType<typeof createMockProService>;
  let mockAvailabilityService: ReturnType<typeof createMockAvailabilityService>;
  let mockSearchCategoryRepository: ReturnType<
    typeof createMockSearchCategoryRepository
  >;
  let mockLocationService: ReturnType<typeof createMockLocationService>;

  function createMockSearchCategoryRepository(): {
    resolveQuery: ReturnType<typeof vi.fn>;
  } {
    return {
      resolveQuery: vi.fn().mockResolvedValue(null),
    };
  }

  function createMockProService(): {
    searchPros: ReturnType<typeof vi.fn>;
  } {
    return {
      searchPros: vi.fn(),
    };
  }

  function createMockAvailabilityService(): {
    isProAvailableInTimeWindow: ReturnType<typeof vi.fn>;
    isProAvailableOnDay: ReturnType<typeof vi.fn>;
    isProAvailableInTimeWindowOnly: ReturnType<typeof vi.fn>;
  } {
    return {
      isProAvailableInTimeWindow: vi.fn(),
      isProAvailableOnDay: vi.fn(),
      isProAvailableInTimeWindowOnly: vi.fn(),
    };
  }

  function createMockLocationService(): {
    resolveUserLocation: ReturnType<typeof vi.fn>;
  } {
    return {
      resolveUserLocation: vi.fn().mockResolvedValue(null),
    };
  }

  function createMockPro(overrides?: Partial<Pro>): Pro {
    return {
      id: "pro-1",
      name: "Test Pro",
      email: "pro@example.com",
      phone: "+1234567890",
      bio: "Test bio",
      avatarUrl: "https://example.com/avatar.jpg",
      hourlyRate: 10000, // 100 UYU/hour in minor units (cents)
      categoryIds: ["cat-plumbing"],
      serviceArea: "Test Area",
      serviceRadiusKm: 10,
      rating: 4.5,
      reviewCount: 10,
      isApproved: true,
      isSuspended: false,
      isAvailable: true,
      profileCompleted: true,
      completedJobsCount: 5,
      isTopPro: false,
      responseTimeMinutes: undefined,
      availabilitySlots: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockProService = createMockProService();
    mockAvailabilityService = createMockAvailabilityService();
    mockSearchCategoryRepository = createMockSearchCategoryRepository();
    mockLocationService = createMockLocationService();

    service = new SearchService(
      mockProService as unknown as ProService,
      mockAvailabilityService as unknown as AvailabilityService,
      mockSearchCategoryRepository as unknown as SearchCategoryRepository,
      mockLocationService as unknown as import("@modules/location/location.service").LocationService
    );
    vi.clearAllMocks();
  });

  describe("searchPros", () => {
    it("should return pros filtered by database when no availability filters", async () => {
      // Arrange
      const pros = [
        createMockPro({ id: "pro-1", categoryIds: ["cat-plumbing"] }),
        createMockPro({ id: "pro-2", categoryIds: ["cat-electrical"] }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);

      // Act
      const result = await service.searchPros({});

      // Assert
      expect(mockProService.searchPros).toHaveBeenCalledWith({});
      expect(
        mockAvailabilityService.isProAvailableOnDay
      ).not.toHaveBeenCalled();
      expect(
        mockAvailabilityService.isProAvailableInTimeWindow
      ).not.toHaveBeenCalled();
      expect(
        mockAvailabilityService.isProAvailableInTimeWindowOnly
      ).not.toHaveBeenCalled();
      expect(result).toEqual(pros);
    });

    it("should filter by categoryId when provided", async () => {
      // Arrange
      const pros = [
        createMockPro({ id: "pro-1", categoryIds: ["cat-plumbing"] }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);

      // Act
      const result = await service.searchPros({
        categoryId: "cat-plumbing",
      });

      // Assert
      expect(mockProService.searchPros).toHaveBeenCalledWith({
        categoryId: "cat-plumbing",
      });
      expect(result).toEqual(pros);
    });

    it("should filter by date only", async () => {
      // Arrange
      const date = new Date("2026-01-25T10:00:00Z");
      const pros = [
        createMockPro({ id: "pro-1" }),
        createMockPro({ id: "pro-2" }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);
      mockAvailabilityService.isProAvailableOnDay
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // Act
      const result = await service.searchPros({ date });

      // Assert
      expect(mockProService.searchPros).toHaveBeenCalledWith({});
      expect(mockAvailabilityService.isProAvailableOnDay).toHaveBeenCalledTimes(
        2
      );
      expect(mockAvailabilityService.isProAvailableOnDay).toHaveBeenCalledWith(
        "pro-1",
        date
      );
      expect(mockAvailabilityService.isProAvailableOnDay).toHaveBeenCalledWith(
        "pro-2",
        date
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pro-1");
    });

    it("should filter by timeWindow only", async () => {
      // Arrange
      const timeWindow = "09:00-12:00";
      const pros = [
        createMockPro({ id: "pro-1" }),
        createMockPro({ id: "pro-2" }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);
      mockAvailabilityService.isProAvailableInTimeWindowOnly
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // Act
      const result = await service.searchPros({ timeWindow });

      // Assert
      expect(mockProService.searchPros).toHaveBeenCalledWith({});
      expect(
        mockAvailabilityService.isProAvailableInTimeWindowOnly
      ).toHaveBeenCalledTimes(2);
      expect(
        mockAvailabilityService.isProAvailableInTimeWindowOnly
      ).toHaveBeenCalledWith("pro-1", timeWindow);
      expect(
        mockAvailabilityService.isProAvailableInTimeWindowOnly
      ).toHaveBeenCalledWith("pro-2", timeWindow);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pro-1");
    });

    it("should filter by both date and timeWindow", async () => {
      // Arrange
      const date = new Date("2026-01-25T10:00:00Z");
      const timeWindow = "09:00-12:00";
      const pros = [
        createMockPro({ id: "pro-1" }),
        createMockPro({ id: "pro-2" }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);
      mockAvailabilityService.isProAvailableInTimeWindow
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // Act
      const result = await service.searchPros({ date, timeWindow });

      // Assert
      expect(mockProService.searchPros).toHaveBeenCalledWith({});
      expect(
        mockAvailabilityService.isProAvailableInTimeWindow
      ).toHaveBeenCalledTimes(2);
      expect(
        mockAvailabilityService.isProAvailableInTimeWindow
      ).toHaveBeenCalledWith("pro-1", date, timeWindow);
      expect(
        mockAvailabilityService.isProAvailableInTimeWindow
      ).toHaveBeenCalledWith("pro-2", date, timeWindow);
      expect(
        mockAvailabilityService.isProAvailableOnDay
      ).not.toHaveBeenCalled();
      expect(
        mockAvailabilityService.isProAvailableInTimeWindowOnly
      ).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pro-1");
    });

    it("should filter by categoryId and date", async () => {
      // Arrange
      const date = new Date("2026-01-25T10:00:00Z");
      const pros = [
        createMockPro({ id: "pro-1", categoryIds: ["cat-plumbing"] }),
        createMockPro({ id: "pro-2", categoryIds: ["cat-plumbing"] }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);
      mockAvailabilityService.isProAvailableOnDay
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // Act
      const result = await service.searchPros({
        categoryId: "cat-plumbing",
        date,
      });

      // Assert
      expect(mockProService.searchPros).toHaveBeenCalledWith({
        categoryId: "cat-plumbing",
      });
      expect(mockAvailabilityService.isProAvailableOnDay).toHaveBeenCalledTimes(
        2
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pro-1");
    });

    it("should filter by categoryId, date, and timeWindow", async () => {
      // Arrange
      const date = new Date("2026-01-25T10:00:00Z");
      const timeWindow = "09:00-12:00";
      const pros = [
        createMockPro({ id: "pro-1", categoryIds: ["cat-plumbing"] }),
        createMockPro({ id: "pro-2", categoryIds: ["cat-plumbing"] }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);
      mockAvailabilityService.isProAvailableInTimeWindow
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // Act
      const result = await service.searchPros({
        categoryId: "cat-plumbing",
        date,
        timeWindow,
      });

      // Assert
      expect(mockProService.searchPros).toHaveBeenCalledWith({
        categoryId: "cat-plumbing",
      });
      expect(
        mockAvailabilityService.isProAvailableInTimeWindow
      ).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pro-1");
    });

    it("should return empty array when no pros match availability", async () => {
      // Arrange
      const date = new Date("2026-01-25T10:00:00Z");
      const pros = [
        createMockPro({ id: "pro-1" }),
        createMockPro({ id: "pro-2" }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);
      mockAvailabilityService.isProAvailableOnDay
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      // Act
      const result = await service.searchPros({ date });

      // Assert
      expect(result).toHaveLength(0);
    });

    it("should return empty array when no pros are returned from service", async () => {
      // Arrange
      mockProService.searchPros.mockResolvedValue([]);

      // Act
      const result = await service.searchPros({});

      // Assert
      expect(result).toHaveLength(0);
      expect(
        mockAvailabilityService.isProAvailableOnDay
      ).not.toHaveBeenCalled();
    });

    it("should ignore subcategory filter for proService (only categoryId is passed)", async () => {
      // Arrange
      const pros = [
        createMockPro({ id: "pro-1", categoryIds: ["cat-plumbing"] }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);

      // Act
      const result = await service.searchPros({
        categoryId: "cat-plumbing",
        subcategory: "drain-cleaning",
      });

      // Assert
      expect(mockProService.searchPros).toHaveBeenCalledWith({
        categoryId: "cat-plumbing",
      });
      expect(result).toEqual(pros);
    });

    it("should resolve q to categoryId and subcategory when q is provided", async () => {
      // Arrange
      const pros = [
        createMockPro({ id: "pro-1", categoryIds: ["cat-plumbing"] }),
      ];
      mockSearchCategoryRepository.resolveQuery.mockResolvedValue({
        categoryId: "cat-plumbing",
        subcategorySlug: "fugas-goteras",
      });
      mockProService.searchPros.mockResolvedValue(pros);

      // Act
      const result = await service.searchPros({
        q: "plomero fugas",
      });

      // Assert
      expect(mockSearchCategoryRepository.resolveQuery).toHaveBeenCalledWith(
        "plomero fugas"
      );
      expect(mockProService.searchPros).toHaveBeenCalledWith({
        categoryId: "cat-plumbing",
      });
      expect(result).toEqual(pros);
    });

    it("should not resolve when q is blank", async () => {
      mockProService.searchPros.mockResolvedValue([]);

      await service.searchPros({ q: "   " });

      expect(mockSearchCategoryRepository.resolveQuery).not.toHaveBeenCalled();
      expect(mockProService.searchPros).toHaveBeenCalledWith({});
    });

    it("should handle multiple pros with mixed availability", async () => {
      // Arrange
      const date = new Date("2026-01-25T10:00:00Z");
      const pros = [
        createMockPro({ id: "pro-1" }),
        createMockPro({ id: "pro-2" }),
        createMockPro({ id: "pro-3" }),
        createMockPro({ id: "pro-4" }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);
      mockAvailabilityService.isProAvailableOnDay
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      // Act
      const result = await service.searchPros({ date });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("pro-1");
      expect(result[1].id).toBe("pro-3");
    });

    it("should preserve pro order when filtering by availability", async () => {
      // Arrange
      const date = new Date("2026-01-25T10:00:00Z");
      const pros = [
        createMockPro({ id: "pro-1", name: "Pro A" }),
        createMockPro({ id: "pro-2", name: "Pro B" }),
        createMockPro({ id: "pro-3", name: "Pro C" }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);
      mockAvailabilityService.isProAvailableOnDay
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      // Act
      const result = await service.searchPros({ date });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("pro-2");
      expect(result[1].id).toBe("pro-3");
    });

    it("should filter by radius when location is resolved", async () => {
      // pro-1: 10km from search point (~0.1 deg ≈ 11km) - within 50km radius
      // pro-2: 500+ km away - excluded
      const pros = [
        createMockPro({
          id: "pro-1",
          baseLatitude: -34.95,
          baseLongitude: -56.2,
          serviceRadiusKm: 50,
        }),
        createMockPro({
          id: "pro-2",
          baseLatitude: -30,
          baseLongitude: -58,
          serviceRadiusKm: 10,
        }),
      ];
      mockProService.searchPros.mockResolvedValue(pros);
      mockLocationService.resolveUserLocation.mockResolvedValue({
        latitude: -34.9,
        longitude: -56.2,
      });

      const result = await service.searchPros({
        location: "Bulevar España 1234, 11300 Montevideo",
      });

      expect(mockLocationService.resolveUserLocation).toHaveBeenCalledWith(
        "UY",
        { location: "Bulevar España 1234, 11300 Montevideo" }
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pro-1");
    });

    it("should sort by distance when location is resolved", async () => {
      const pros = [
        createMockPro({
          id: "far",
          baseLatitude: -34.5,
          baseLongitude: -56.5,
          serviceRadiusKm: 100,
        }),
        createMockPro({
          id: "near",
          baseLatitude: -34.9,
          baseLongitude: -56.2,
          serviceRadiusKm: 100,
        }),
      ];
      mockProService.searchPros.mockResolvedValue(pros);
      mockLocationService.resolveUserLocation.mockResolvedValue({
        latitude: -34.9,
        longitude: -56.2,
      });

      const result = await service.searchPros({
        location: "Bulevar España 1234, 11300 Montevideo",
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("near");
      expect(result[1].id).toBe("far");
    });
  });
});
