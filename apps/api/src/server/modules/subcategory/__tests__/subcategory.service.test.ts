import { describe, it, expect, beforeEach, vi } from "vitest";
import { SubcategoryService } from "../subcategory.service";
import type { SubcategoryRepository } from "../subcategory.repo";

describe("SubcategoryService", () => {
  let service: SubcategoryService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  function createMockRepository(): {
    findById: ReturnType<typeof vi.fn>;
    findBySlugAndCategoryId: ReturnType<typeof vi.fn>;
    findByCategoryId: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
      findBySlugAndCategoryId: vi.fn(),
      findByCategoryId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
  }

  function createSubcategoryEntity(
    overrides?: Partial<{
      id: string;
      name: string;
      slug: string;
      categoryId: string;
      key: string | null;
      imageUrl: string | null;
      description: string | null;
      displayOrder: number;
      isActive: boolean;
      configJson: Record<string, unknown> | null;
      searchKeywords: string[];
      createdAt: Date;
      updatedAt: Date;
    }>
  ) {
    const now = new Date();
    return {
      id: "subcat-123",
      name: "Fugas y goteras",
      slug: "fugas-goteras",
      categoryId: "cat-plumbing",
      key: "LEAKS",
      imageUrl: "/images/subcategories/plumbing-leak.jpg",
      description: "Reparación de fugas y goteras",
      displayOrder: 0,
      isActive: true,
      configJson: null,
      searchKeywords: [],
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

  describe("getSubcategoriesByCategoryId", () => {
    it("should return subcategories for a given categoryId", async () => {
      // Arrange
      const entities = [
        createSubcategoryEntity({
          slug: "fugas-goteras",
          displayOrder: 0,
          categoryId: "cat-plumbing",
        }),
        createSubcategoryEntity({
          slug: "instalaciones",
          displayOrder: 1,
          categoryId: "cat-plumbing",
        }),
      ];
      mockRepository.findByCategoryId.mockResolvedValue(entities);

      // Act
      const result = await service.getSubcategoriesByCategoryId("cat-plumbing");

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe("fugas-goteras");
      expect(result[1].slug).toBe("instalaciones");
      expect(mockRepository.findByCategoryId).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByCategoryId).toHaveBeenCalledWith(
        "cat-plumbing"
      );
    });

    it("should return empty array when no subcategories found for categoryId", async () => {
      // Arrange
      mockRepository.findByCategoryId.mockResolvedValue([]);

      // Act
      const result =
        await service.getSubcategoriesByCategoryId("cat-electrical");

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.findByCategoryId).toHaveBeenCalledWith(
        "cat-electrical"
      );
    });

    it("should map entities to domain models correctly", async () => {
      // Arrange
      const entity = createSubcategoryEntity({
        name: "Instalaciones eléctricas",
        slug: "instalaciones-electricas",
        categoryId: "cat-electrical",
      });
      mockRepository.findByCategoryId.mockResolvedValue([entity]);

      // Act
      const result =
        await service.getSubcategoriesByCategoryId("cat-electrical");

      // Assert
      expect(result[0]).toEqual({
        id: entity.id,
        name: "Instalaciones eléctricas",
        slug: "instalaciones-electricas",
        categoryId: "cat-electrical",
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
        categoryId: "cat-cleaning",
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
        categoryId: "cat-cleaning",
        imageUrl: null,
        description: null,
        displayOrder: 10,
        isActive: false,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      });
    });
  });

  describe("getSubcategoryBySlugAndCategoryId", () => {
    it("should return subcategory when found by slug and categoryId", async () => {
      // Arrange
      const entity = createSubcategoryEntity({
        slug: "fugas-goteras",
        categoryId: "cat-plumbing",
      });
      mockRepository.findBySlugAndCategoryId.mockResolvedValue(entity);

      // Act
      const result = await service.getSubcategoryBySlugAndCategoryId(
        "fugas-goteras",
        "cat-plumbing"
      );

      // Assert
      expect(result).not.toBeNull();
      expect(result?.slug).toBe("fugas-goteras");
      expect(result?.categoryId).toBe("cat-plumbing");
      expect(mockRepository.findBySlugAndCategoryId).toHaveBeenCalledTimes(1);
      expect(mockRepository.findBySlugAndCategoryId).toHaveBeenCalledWith(
        "fugas-goteras",
        "cat-plumbing"
      );
    });

    it("should return null when subcategory not found by slug", async () => {
      // Arrange
      mockRepository.findBySlugAndCategoryId.mockResolvedValue(null);

      // Act
      const result = await service.getSubcategoryBySlugAndCategoryId(
        "non-existent",
        "cat-plumbing"
      );

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findBySlugAndCategoryId).toHaveBeenCalledWith(
        "non-existent",
        "cat-plumbing"
      );
    });

    it("should handle different categories with same slug", async () => {
      // Arrange
      const plumbingEntity = createSubcategoryEntity({
        slug: "instalaciones",
        categoryId: "cat-plumbing",
      });
      const electricalEntity = createSubcategoryEntity({
        slug: "instalaciones",
        categoryId: "cat-electrical",
        name: "Instalaciones eléctricas",
      });

      mockRepository.findBySlugAndCategoryId
        .mockResolvedValueOnce(plumbingEntity)
        .mockResolvedValueOnce(electricalEntity);

      // Act
      const plumbingResult = await service.getSubcategoryBySlugAndCategoryId(
        "instalaciones",
        "cat-plumbing"
      );
      const electricalResult = await service.getSubcategoryBySlugAndCategoryId(
        "instalaciones",
        "cat-electrical"
      );

      // Assert
      expect(plumbingResult?.categoryId).toBe("cat-plumbing");
      expect(electricalResult?.categoryId).toBe("cat-electrical");
      expect(electricalResult?.name).toBe("Instalaciones eléctricas");
    });
  });

  describe("getAllSubcategories", () => {
    it("should return all active subcategories", async () => {
      // Arrange
      const entities = [
        createSubcategoryEntity({
          id: "subcat-1",
          categoryId: "cat-plumbing",
          displayOrder: 0,
        }),
        createSubcategoryEntity({
          id: "subcat-2",
          categoryId: "cat-electrical",
          displayOrder: 0,
        }),
        createSubcategoryEntity({
          id: "subcat-3",
          categoryId: "cat-cleaning",
          displayOrder: 0,
        }),
      ];
      mockRepository.findAll.mockResolvedValue(entities);

      // Act
      const result = await service.getAllSubcategories();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].categoryId).toBe("cat-plumbing");
      expect(result[1].categoryId).toBe("cat-electrical");
      expect(result[2].categoryId).toBe("cat-cleaning");
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
        categoryId: "cat-handyman",
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
        categoryId: "cat-handyman",
        imageUrl: "/test/image.jpg",
        description: "Test description",
        displayOrder: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    });
  });

  describe("validateSubcategoryBelongsToCategory", () => {
    it("should not throw when subcategory belongs to category", async () => {
      // Arrange
      const entity = createSubcategoryEntity({
        id: "subcat-123",
        categoryId: "cat-plumbing",
      });
      mockRepository.findById.mockResolvedValue(entity);

      // Act & Assert
      await expect(
        service.validateSubcategoryBelongsToCategory(
          "subcat-123",
          "cat-plumbing"
        )
      ).resolves.not.toThrow();
      expect(mockRepository.findById).toHaveBeenCalledWith("subcat-123");
    });

    it("should throw error when subcategory does not belong to category", async () => {
      // Arrange
      const entity = createSubcategoryEntity({
        id: "subcat-123",
        categoryId: "cat-plumbing",
      });
      mockRepository.findById.mockResolvedValue(entity);

      // Act & Assert
      await expect(
        service.validateSubcategoryBelongsToCategory(
          "subcat-123",
          "cat-electrical"
        )
      ).rejects.toThrow(
        "Subcategory subcat-123 does not belong to category cat-electrical"
      );
      expect(mockRepository.findById).toHaveBeenCalledWith("subcat-123");
    });

    it("should throw error when subcategory not found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.validateSubcategoryBelongsToCategory(
          "non-existent",
          "cat-plumbing"
        )
      ).rejects.toThrow("Subcategory not found: non-existent");
      expect(mockRepository.findById).toHaveBeenCalledWith("non-existent");
    });
  });

  describe("createSubcategory", () => {
    it("should create a new subcategory when slug does not exist in category", async () => {
      // Arrange
      const input = {
        name: "Fugas y goteras",
        slug: "fugas-goteras",
        categoryId: "cat-plumbing",
        imageUrl: "/images/fugas.jpg",
        description: "Reparación de fugas",
        displayOrder: 0,
        isActive: true,
      };
      const createdEntity = createSubcategoryEntity(input);
      mockRepository.findBySlugAndCategoryId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdEntity);

      // Act
      const result = await service.createSubcategory(input);

      // Assert
      expect(result).toEqual({
        id: createdEntity.id,
        name: input.name,
        slug: input.slug,
        categoryId: input.categoryId,
        imageUrl: input.imageUrl,
        description: input.description,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
        createdAt: createdEntity.createdAt,
        updatedAt: createdEntity.updatedAt,
      });
      expect(mockRepository.findBySlugAndCategoryId).toHaveBeenCalledWith(
        input.slug,
        input.categoryId
      );
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: input.name,
        slug: input.slug,
        categoryId: input.categoryId,
        imageUrl: input.imageUrl,
        description: input.description,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
      });
    });

    it("should use default values for optional fields", async () => {
      // Arrange
      const input = {
        name: "Instalaciones",
        slug: "instalaciones",
        categoryId: "cat-plumbing",
      };
      const createdEntity = createSubcategoryEntity({
        ...input,
        imageUrl: null,
        description: null,
        displayOrder: 0,
        isActive: true,
      });
      mockRepository.findBySlugAndCategoryId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdEntity);

      // Act
      const result = await service.createSubcategory(input);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: input.name,
        slug: input.slug,
        categoryId: input.categoryId,
        imageUrl: undefined,
        description: undefined,
        displayOrder: 0,
        isActive: true,
      });
      expect(result.isActive).toBe(true);
      expect(result.displayOrder).toBe(0);
    });

    it("should throw error when subcategory with same slug already exists in category", async () => {
      // Arrange
      const input = {
        name: "Fugas y goteras",
        slug: "fugas-goteras",
        categoryId: "cat-plumbing",
      };
      const existingEntity = createSubcategoryEntity({
        slug: "fugas-goteras",
        categoryId: "cat-plumbing",
      });
      mockRepository.findBySlugAndCategoryId.mockResolvedValue(existingEntity);

      // Act & Assert
      await expect(service.createSubcategory(input)).rejects.toThrow(
        'Subcategory with slug "fugas-goteras" already exists in this category'
      );
      expect(mockRepository.findBySlugAndCategoryId).toHaveBeenCalledWith(
        input.slug,
        input.categoryId
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("updateSubcategory", () => {
    it("should update subcategory successfully", async () => {
      // Arrange
      const updateInput = {
        name: "Fugas y goteras actualizado",
        description: "Nueva descripción",
      };
      const existingEntity = createSubcategoryEntity({
        id: "subcat-123",
        categoryId: "cat-plumbing",
      });
      const updatedEntity = createSubcategoryEntity({
        id: "subcat-123",
        name: "Fugas y goteras actualizado",
        description: "Nueva descripción",
        categoryId: "cat-plumbing",
      });
      mockRepository.findById.mockResolvedValue(existingEntity);
      mockRepository.update.mockResolvedValue(updatedEntity);

      // Act
      const result = await service.updateSubcategory("subcat-123", updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Fugas y goteras actualizado");
      expect(result?.description).toBe("Nueva descripción");
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      expect(mockRepository.update).toHaveBeenCalledWith(
        "subcat-123",
        updateInput
      );
    });

    it("should return null when subcategory not found", async () => {
      // Arrange
      const updateInput = { name: "New Name" };
      mockRepository.findById.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(null);

      // Act
      const result = await service.updateSubcategory(
        "non-existent",
        updateInput
      );

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith(
        "non-existent",
        updateInput
      );
    });

    it("should check slug conflicts when slug is being updated", async () => {
      // Arrange
      const updateInput = {
        slug: "new-slug",
      };
      const existingEntity = createSubcategoryEntity({
        id: "subcat-123",
        slug: "old-slug",
        categoryId: "cat-plumbing",
      });
      const conflictingEntity = createSubcategoryEntity({
        id: "subcat-456",
        slug: "new-slug",
        categoryId: "cat-plumbing",
      });
      mockRepository.findById.mockResolvedValue(existingEntity);
      mockRepository.findBySlugAndCategoryId.mockResolvedValue(
        conflictingEntity
      );

      // Act & Assert
      await expect(
        service.updateSubcategory("subcat-123", updateInput)
      ).rejects.toThrow(
        'Subcategory with slug "new-slug" already exists in this category'
      );
      expect(mockRepository.findById).toHaveBeenCalledWith("subcat-123");
      expect(mockRepository.findBySlugAndCategoryId).toHaveBeenCalledWith(
        "new-slug",
        "cat-plumbing"
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should allow updating slug to same value", async () => {
      // Arrange
      const updateInput = {
        slug: "existing-slug",
      };
      const existingEntity = createSubcategoryEntity({
        id: "subcat-123",
        slug: "existing-slug",
        categoryId: "cat-plumbing",
      });
      const updatedEntity = createSubcategoryEntity({
        id: "subcat-123",
        slug: "existing-slug",
        categoryId: "cat-plumbing",
      });
      mockRepository.findById.mockResolvedValue(existingEntity);
      mockRepository.findBySlugAndCategoryId.mockResolvedValue(existingEntity);
      mockRepository.update.mockResolvedValue(updatedEntity);

      // Act
      const result = await service.updateSubcategory("subcat-123", updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it("should use provided categoryId when updating slug", async () => {
      // Arrange
      const updateInput = {
        slug: "new-slug",
        categoryId: "cat-electrical",
      };
      const existingEntity = createSubcategoryEntity({
        id: "subcat-123",
        categoryId: "cat-plumbing",
      });
      mockRepository.findById.mockResolvedValue(existingEntity);
      mockRepository.findBySlugAndCategoryId.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(
        createSubcategoryEntity({
          id: "subcat-123",
          slug: "new-slug",
          categoryId: "cat-electrical",
        })
      );

      // Act
      await service.updateSubcategory("subcat-123", updateInput);

      // Assert
      expect(mockRepository.findBySlugAndCategoryId).toHaveBeenCalledWith(
        "new-slug",
        "cat-electrical"
      );
    });
  });

  describe("deleteSubcategory", () => {
    it("should delete subcategory successfully", async () => {
      // Arrange
      const entity = createSubcategoryEntity({
        id: "subcat-123",
        categoryId: "cat-plumbing",
      });
      mockRepository.findById.mockResolvedValue(entity);
      mockRepository.delete.mockResolvedValue(undefined);

      // Act
      await service.deleteSubcategory("subcat-123");

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith("subcat-123");
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockRepository.delete).toHaveBeenCalledWith("subcat-123");
    });

    it("should throw error when subcategory not found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteSubcategory("non-existent")).rejects.toThrow(
        "Subcategory not found with id non-existent"
      );
      expect(mockRepository.findById).toHaveBeenCalledWith("non-existent");
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
