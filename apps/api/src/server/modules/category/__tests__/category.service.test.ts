import { describe, it, expect, beforeEach, vi } from "vitest";
import { CategoryService } from "../category.service";
import type { CategoryMetadataRepository } from "../category.repo";
import { Category } from "@repo/domain";

describe("CategoryService", () => {
  let service: CategoryService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  function createMockRepository(): {
    findByCategory: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
  } {
    return {
      findByCategory: vi.fn(),
      findAll: vi.fn(),
    };
  }

  function createCategoryMetadataEntity(
    overrides?: Partial<{
      id: string;
      category: Category;
      displayName: string;
      iconName: string | null;
      description: string | null;
      displayOrder: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>
  ) {
    const now = new Date();
    return {
      id: "cat-123",
      category: Category.PLUMBING,
      displayName: "Plomería",
      iconName: "Wrench",
      description: "Servicios de plomería",
      displayOrder: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new CategoryService(
      mockRepository as unknown as CategoryMetadataRepository
    );
    vi.clearAllMocks();
  });

  describe("getCategoryMetadata", () => {
    it("should return category metadata when found", async () => {
      // Arrange
      const entity = createCategoryMetadataEntity({
        category: Category.PLUMBING,
        displayName: "Plomería",
      });
      mockRepository.findByCategory.mockResolvedValue(entity);

      // Act
      const result = await service.getCategoryMetadata(Category.PLUMBING);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.category).toBe(Category.PLUMBING);
      expect(result?.displayName).toBe("Plomería");
      expect(result?.iconName).toBe("Wrench");
      expect(result?.id).toBe("cat-123");
      expect(mockRepository.findByCategory).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByCategory).toHaveBeenCalledWith(
        Category.PLUMBING
      );
    });

    it("should return null when category metadata not found", async () => {
      // Arrange
      mockRepository.findByCategory.mockResolvedValue(null);

      // Act
      const result = await service.getCategoryMetadata(Category.ELECTRICAL);

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findByCategory).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByCategory).toHaveBeenCalledWith(
        Category.ELECTRICAL
      );
    });

    it("should map entity to domain model correctly", async () => {
      // Arrange
      const entity = createCategoryMetadataEntity({
        category: Category.CLEANING,
        displayName: "Limpieza",
        iconName: "Sparkles",
        description: "Servicios de limpieza",
        displayOrder: 2,
        isActive: true,
      });
      mockRepository.findByCategory.mockResolvedValue(entity);

      // Act
      const result = await service.getCategoryMetadata(Category.CLEANING);

      // Assert
      expect(result).toEqual({
        id: entity.id,
        category: Category.CLEANING,
        displayName: "Limpieza",
        iconName: "Sparkles",
        description: "Servicios de limpieza",
        displayOrder: 2,
        isActive: true,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      });
    });

    it("should handle null iconName and description", async () => {
      // Arrange
      const entity = createCategoryMetadataEntity({
        iconName: null,
        description: null,
      });
      mockRepository.findByCategory.mockResolvedValue(entity);

      // Act
      const result = await service.getCategoryMetadata(Category.PLUMBING);

      // Assert
      expect(result?.iconName).toBeNull();
      expect(result?.description).toBeNull();
    });
  });

  describe("getAllCategoriesMetadata", () => {
    it("should return all active category metadata", async () => {
      // Arrange
      const entities = [
        createCategoryMetadataEntity({
          category: Category.PLUMBING,
          displayOrder: 0,
        }),
        createCategoryMetadataEntity({
          category: Category.ELECTRICAL,
          displayOrder: 1,
        }),
        createCategoryMetadataEntity({
          category: Category.CLEANING,
          displayOrder: 2,
        }),
      ];
      mockRepository.findAll.mockResolvedValue(entities);

      // Act
      const result = await service.getAllCategoriesMetadata();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].category).toBe(Category.PLUMBING);
      expect(result[1].category).toBe(Category.ELECTRICAL);
      expect(result[2].category).toBe(Category.CLEANING);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no categories exist", async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getAllCategoriesMetadata();

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it("should map all entities to domain models", async () => {
      // Arrange
      const entities = [
        createCategoryMetadataEntity({
          id: "cat-1",
          category: Category.HANDYMAN,
          displayName: "Arreglos generales",
        }),
        createCategoryMetadataEntity({
          id: "cat-2",
          category: Category.PAINTING,
          displayName: "Pintura",
        }),
      ];
      mockRepository.findAll.mockResolvedValue(entities);

      // Act
      const result = await service.getAllCategoriesMetadata();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("cat-1");
      expect(result[0].displayName).toBe("Arreglos generales");
      expect(result[1].id).toBe("cat-2");
      expect(result[1].displayName).toBe("Pintura");
    });

    it("should preserve all entity fields in domain model", async () => {
      // Arrange
      const now = new Date();
      const entity = createCategoryMetadataEntity({
        id: "cat-test",
        category: Category.PLUMBING,
        displayName: "Test Category",
        iconName: "TestIcon",
        description: "Test Description",
        displayOrder: 5,
        isActive: false,
        createdAt: now,
        updatedAt: now,
      });
      mockRepository.findAll.mockResolvedValue([entity]);

      // Act
      const result = await service.getAllCategoriesMetadata();

      // Assert
      expect(result[0]).toEqual({
        id: "cat-test",
        category: Category.PLUMBING,
        displayName: "Test Category",
        iconName: "TestIcon",
        description: "Test Description",
        displayOrder: 5,
        isActive: false,
        createdAt: now,
        updatedAt: now,
      });
    });
  });
});
