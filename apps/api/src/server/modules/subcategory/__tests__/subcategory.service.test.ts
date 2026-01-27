import { describe, it, expect, beforeEach, vi } from "vitest";
import { SubcategoryService } from "../subcategory.service";
import type { SubcategoryRepository } from "../subcategory.repo";
import { Category } from "@repo/domain";

describe("SubcategoryService", () => {
  let service: SubcategoryService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  function createMockRepository(): {
    findById: ReturnType<typeof vi.fn>;
    findBySlug: ReturnType<typeof vi.fn>;
    findByCategory: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByCategory: vi.fn(),
      findAll: vi.fn(),
    };
  }

  function createSubcategoryEntity(
    overrides?: Partial<{
      id: string;
      name: string;
      slug: string;
      category: Category;
      imageUrl: string | null;
      description: string | null;
      displayOrder: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>
  ) {
    const now = new Date();
    return {
      id: "subcat-123",
      name: "Fugas y goteras",
      slug: "fugas-goteras",
      category: Category.PLUMBING,
      imageUrl: "/images/subcategories/plumbing-leak.jpg",
      description: "Reparación de fugas y goteras",
      displayOrder: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new SubcategoryService(
      mockRepository as unknown as SubcategoryRepository
    );
    vi.clearAllMocks();
  });

  describe("getSubcategoriesByCategory", () => {
    it("should return subcategories for a given category", async () => {
      // Arrange
      const entities = [
        createSubcategoryEntity({
          slug: "fugas-goteras",
          displayOrder: 0,
        }),
        createSubcategoryEntity({
          slug: "instalaciones",
          displayOrder: 1,
        }),
      ];
      mockRepository.findByCategory.mockResolvedValue(entities);

      // Act
      const result = await service.getSubcategoriesByCategory(
        Category.PLUMBING
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe("fugas-goteras");
      expect(result[1].slug).toBe("instalaciones");
      expect(mockRepository.findByCategory).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByCategory).toHaveBeenCalledWith(
        Category.PLUMBING
      );
    });

    it("should return empty array when no subcategories found for category", async () => {
      // Arrange
      mockRepository.findByCategory.mockResolvedValue([]);

      // Act
      const result = await service.getSubcategoriesByCategory(
        Category.ELECTRICAL
      );

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.findByCategory).toHaveBeenCalledWith(
        Category.ELECTRICAL
      );
    });

    it("should map entities to domain models correctly", async () => {
      // Arrange
      const entity = createSubcategoryEntity({
        name: "Instalaciones eléctricas",
        slug: "instalaciones-electricas",
        category: Category.ELECTRICAL,
      });
      mockRepository.findByCategory.mockResolvedValue([entity]);

      // Act
      const result = await service.getSubcategoriesByCategory(
        Category.ELECTRICAL
      );

      // Assert
      expect(result[0]).toEqual({
        id: entity.id,
        name: "Instalaciones eléctricas",
        slug: "instalaciones-electricas",
        category: Category.ELECTRICAL,
        imageUrl: entity.imageUrl,
        description: entity.description,
        displayOrder: entity.displayOrder,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      });
    });
  });

  describe("getSubcategoryById", () => {
    it("should return subcategory when found by id", async () => {
      // Arrange
      const entity = createSubcategoryEntity({ id: "subcat-456" });
      mockRepository.findById.mockResolvedValue(entity);

      // Act
      const result = await service.getSubcategoryById("subcat-456");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe("subcat-456");
      expect(result?.name).toBe("Fugas y goteras");
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockRepository.findById).toHaveBeenCalledWith("subcat-456");
    });

    it("should return null when subcategory not found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getSubcategoryById("non-existent");

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith("non-existent");
    });

    it("should map entity to domain model correctly", async () => {
      // Arrange
      const entity = createSubcategoryEntity({
        id: "test-id",
        name: "Test Subcategory",
        slug: "test-slug",
        category: Category.CLEANING,
        imageUrl: null,
        description: null,
        displayOrder: 10,
        isActive: false,
      });
      mockRepository.findById.mockResolvedValue(entity);

      // Act
      const result = await service.getSubcategoryById("test-id");

      // Assert
      expect(result).toEqual({
        id: "test-id",
        name: "Test Subcategory",
        slug: "test-slug",
        category: Category.CLEANING,
        imageUrl: null,
        description: null,
        displayOrder: 10,
        isActive: false,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      });
    });
  });

  describe("getSubcategoryBySlug", () => {
    it("should return subcategory when found by slug and category", async () => {
      // Arrange
      const entity = createSubcategoryEntity({
        slug: "fugas-goteras",
        category: Category.PLUMBING,
      });
      mockRepository.findBySlug.mockResolvedValue(entity);

      // Act
      const result = await service.getSubcategoryBySlug(
        "fugas-goteras",
        Category.PLUMBING
      );

      // Assert
      expect(result).not.toBeNull();
      expect(result?.slug).toBe("fugas-goteras");
      expect(result?.category).toBe(Category.PLUMBING);
      expect(mockRepository.findBySlug).toHaveBeenCalledTimes(1);
      expect(mockRepository.findBySlug).toHaveBeenCalledWith(
        "fugas-goteras",
        Category.PLUMBING
      );
    });

    it("should return null when subcategory not found by slug", async () => {
      // Arrange
      mockRepository.findBySlug.mockResolvedValue(null);

      // Act
      const result = await service.getSubcategoryBySlug(
        "non-existent",
        Category.PLUMBING
      );

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findBySlug).toHaveBeenCalledWith(
        "non-existent",
        Category.PLUMBING
      );
    });

    it("should handle different categories with same slug", async () => {
      // Arrange
      const plumbingEntity = createSubcategoryEntity({
        slug: "instalaciones",
        category: Category.PLUMBING,
      });
      const electricalEntity = createSubcategoryEntity({
        slug: "instalaciones",
        category: Category.ELECTRICAL,
        name: "Instalaciones eléctricas",
      });

      mockRepository.findBySlug
        .mockResolvedValueOnce(plumbingEntity)
        .mockResolvedValueOnce(electricalEntity);

      // Act
      const plumbingResult = await service.getSubcategoryBySlug(
        "instalaciones",
        Category.PLUMBING
      );
      const electricalResult = await service.getSubcategoryBySlug(
        "instalaciones",
        Category.ELECTRICAL
      );

      // Assert
      expect(plumbingResult?.category).toBe(Category.PLUMBING);
      expect(electricalResult?.category).toBe(Category.ELECTRICAL);
      expect(electricalResult?.name).toBe("Instalaciones eléctricas");
    });
  });

  describe("getAllSubcategories", () => {
    it("should return all active subcategories", async () => {
      // Arrange
      const entities = [
        createSubcategoryEntity({
          id: "subcat-1",
          category: Category.PLUMBING,
          displayOrder: 0,
        }),
        createSubcategoryEntity({
          id: "subcat-2",
          category: Category.ELECTRICAL,
          displayOrder: 0,
        }),
        createSubcategoryEntity({
          id: "subcat-3",
          category: Category.CLEANING,
          displayOrder: 0,
        }),
      ];
      mockRepository.findAll.mockResolvedValue(entities);

      // Act
      const result = await service.getAllSubcategories();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].category).toBe(Category.PLUMBING);
      expect(result[1].category).toBe(Category.ELECTRICAL);
      expect(result[2].category).toBe(Category.CLEANING);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no subcategories exist", async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getAllSubcategories();

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it("should map all entities to domain models", async () => {
      // Arrange
      const entities = [
        createSubcategoryEntity({
          id: "subcat-1",
          name: "Subcategory 1",
          slug: "subcategory-1",
        }),
        createSubcategoryEntity({
          id: "subcat-2",
          name: "Subcategory 2",
          slug: "subcategory-2",
        }),
      ];
      mockRepository.findAll.mockResolvedValue(entities);

      // Act
      const result = await service.getAllSubcategories();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("subcat-1");
      expect(result[0].name).toBe("Subcategory 1");
      expect(result[1].id).toBe("subcat-2");
      expect(result[1].name).toBe("Subcategory 2");
    });

    it("should preserve all entity fields in domain model", async () => {
      // Arrange
      const now = new Date();
      const entity = createSubcategoryEntity({
        id: "subcat-test",
        name: "Test Subcategory",
        slug: "test-subcategory",
        category: Category.HANDYMAN,
        imageUrl: "/test/image.jpg",
        description: "Test description",
        displayOrder: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      mockRepository.findAll.mockResolvedValue([entity]);

      // Act
      const result = await service.getAllSubcategories();

      // Assert
      expect(result[0]).toEqual({
        id: "subcat-test",
        name: "Test Subcategory",
        slug: "test-subcategory",
        category: Category.HANDYMAN,
        imageUrl: "/test/image.jpg",
        description: "Test description",
        displayOrder: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    });
  });
});
