import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchService } from "../search.service";
import type { ProService } from "@modules/pro/pro.service";
import type { AvailabilityService } from "@modules/pro/availability.service";
import type { Pro } from "@repo/domain";

describe("SearchService", () => {
  let service: SearchService;
  let mockProService: ReturnType<typeof createMockProService>;
  let mockAvailabilityService: ReturnType<typeof createMockAvailabilityService>;

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

  function createMockPro(overrides?: Partial<Pro>): Pro {
    return {
      id: "pro-1",
      name: "Test Pro",
      email: "pro@example.com",
      phone: "+1234567890",
      bio: "Test bio",
      avatarUrl: "https://example.com/avatar.jpg",
      hourlyRate: 100,
      categoryIds: ["cat-plumbing"],
      serviceArea: "Test Area",
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

    service = new SearchService(
      mockProService as unknown as ProService,
      mockAvailabilityService as unknown as AvailabilityService
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

    it("should ignore subcategory filter (for future use)", async () => {
      // Arrange
      const pros = [
        createMockPro({ id: "pro-1", categoryIds: ["cat-plumbing"] }),
      ];

      mockProService.searchPros.mockResolvedValue(pros);

      // Act
      const result = await service.searchPros({
        categoryId: "cat-plumbing",
        subcategory: "drain-cleaning", // Should be ignored for now
      });

      // Assert
      expect(mockProService.searchPros).toHaveBeenCalledWith({
        categoryId: "cat-plumbing",
      });
      expect(result).toEqual(pros);
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
  });
});
