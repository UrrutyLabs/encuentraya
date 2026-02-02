import { describe, it, expect, beforeEach, vi } from "vitest";
import { CategoryService } from "../category.service";
import type { CategoryRepository } from "../category.repo";
import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@repo/domain";
import { PricingMode, PaymentStrategy } from "@repo/domain";

describe("CategoryService", () => {
  let service: CategoryService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  function createMockRepository(): {
    findById: ReturnType<typeof vi.fn>;
    findByKey: ReturnType<typeof vi.fn>;
    findBySlug: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
      findByKey: vi.fn(),
      findBySlug: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
    };
  }

  function createCategory(overrides?: Partial<Category>): Category {
    const now = new Date();
    return {
      id: "cat-123",
      key: "PLUMBING",
      name: "Plomería",
      slug: "plomeria",
      iconName: "Wrench",
      description: "Servicios de plomería",
      sortOrder: 0,
      pricingMode: PricingMode.HOURLY,
      paymentStrategy: PaymentStrategy.SINGLE_CAPTURE,
      isActive: true,
      deletedAt: null,
      configJson: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new CategoryService(
      mockRepository as unknown as CategoryRepository
    );
    vi.clearAllMocks();
  });

  describe("getCategoryById", () => {
    it("should return category when found", async () => {
      // Arrange
      const category = createCategory({ id: "cat-123" });
      mockRepository.findById.mockResolvedValue(category);

      // Act
      const result = await service.getCategoryById("cat-123");

      // Assert
      expect(result).toEqual(category);
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockRepository.findById).toHaveBeenCalledWith("cat-123", false);
    });

    it("should return null when category not found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getCategoryById("non-existent");

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        "non-existent",
        false
      );
    });

    it("should pass includeDeleted parameter", async () => {
      // Arrange
      const category = createCategory({ deletedAt: new Date() });
      mockRepository.findById.mockResolvedValue(category);

      // Act
      const result = await service.getCategoryById("cat-123", true);

      // Assert
      expect(result).toEqual(category);
      expect(mockRepository.findById).toHaveBeenCalledWith("cat-123", true);
    });
  });

  describe("getCategoryByKey", () => {
    it("should return category when found by key", async () => {
      // Arrange
      const category = createCategory({ key: "PLUMBING" });
      mockRepository.findByKey.mockResolvedValue(category);

      // Act
      const result = await service.getCategoryByKey("PLUMBING");

      // Assert
      expect(result).toEqual(category);
      expect(mockRepository.findByKey).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByKey).toHaveBeenCalledWith("PLUMBING", false);
    });

    it("should return null when category not found", async () => {
      // Arrange
      mockRepository.findByKey.mockResolvedValue(null);

      // Act
      const result = await service.getCategoryByKey("NON_EXISTENT");

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findByKey).toHaveBeenCalledWith(
        "NON_EXISTENT",
        false
      );
    });

    it("should pass includeDeleted parameter", async () => {
      // Arrange
      const category = createCategory({
        key: "PLUMBING",
        deletedAt: new Date(),
      });
      mockRepository.findByKey.mockResolvedValue(category);

      // Act
      const result = await service.getCategoryByKey("PLUMBING", true);

      // Assert
      expect(result).toEqual(category);
      expect(mockRepository.findByKey).toHaveBeenCalledWith("PLUMBING", true);
    });
  });

  describe("category pricingMode and paymentStrategy", () => {
    it("should return category with pricingMode and paymentStrategy", async () => {
      const category = createCategory({
        id: "cat-1",
        pricingMode: PricingMode.HOURLY,
        paymentStrategy: PaymentStrategy.SINGLE_CAPTURE,
      });
      mockRepository.findById.mockResolvedValue(category);

      const result = await service.getCategoryById("cat-1");

      expect(result).toBeDefined();
      expect(result?.pricingMode).toBe(PricingMode.HOURLY);
      expect(result?.paymentStrategy).toBe(PaymentStrategy.SINGLE_CAPTURE);
    });

    it("should return category with pricingMode fixed", async () => {
      const category = createCategory({
        id: "cat-fixed",
        pricingMode: PricingMode.FIXED,
        paymentStrategy: PaymentStrategy.SINGLE_CAPTURE,
      });
      mockRepository.findById.mockResolvedValue(category);

      const result = await service.getCategoryById("cat-fixed");

      expect(result?.pricingMode).toBe(PricingMode.FIXED);
      expect(result?.paymentStrategy).toBe(PaymentStrategy.SINGLE_CAPTURE);
    });
  });

  describe("getCategoryBySlug", () => {
    it("should return category when found by slug", async () => {
      // Arrange
      const category = createCategory({ slug: "plomeria" });
      mockRepository.findBySlug.mockResolvedValue(category);

      // Act
      const result = await service.getCategoryBySlug("plomeria");

      // Assert
      expect(result).toEqual(category);
      expect(mockRepository.findBySlug).toHaveBeenCalledTimes(1);
      expect(mockRepository.findBySlug).toHaveBeenCalledWith("plomeria", false);
    });

    it("should return null when category not found", async () => {
      // Arrange
      mockRepository.findBySlug.mockResolvedValue(null);

      // Act
      const result = await service.getCategoryBySlug("non-existent");

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findBySlug).toHaveBeenCalledWith(
        "non-existent",
        false
      );
    });

    it("should pass includeDeleted parameter", async () => {
      // Arrange
      const category = createCategory({
        slug: "plomeria",
        deletedAt: new Date(),
      });
      mockRepository.findBySlug.mockResolvedValue(category);

      // Act
      const result = await service.getCategoryBySlug("plomeria", true);

      // Assert
      expect(result).toEqual(category);
      expect(mockRepository.findBySlug).toHaveBeenCalledWith("plomeria", true);
    });
  });

  describe("getAllCategories", () => {
    it("should return all categories", async () => {
      // Arrange
      const categories = [
        createCategory({ id: "cat-1", key: "PLUMBING", name: "Plomería" }),
        createCategory({
          id: "cat-2",
          key: "ELECTRICAL",
          name: "Electricidad",
        }),
        createCategory({ id: "cat-3", key: "CLEANING", name: "Limpieza" }),
      ];
      mockRepository.findAll.mockResolvedValue(categories);

      // Act
      const result = await service.getAllCategories();

      // Assert
      expect(result).toEqual(categories);
      expect(result).toHaveLength(3);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.findAll).toHaveBeenCalledWith(false);
    });

    it("should return empty array when no categories exist", async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getAllCategories();

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it("should pass includeDeleted parameter", async () => {
      // Arrange
      const categories = [
        createCategory({ id: "cat-1", deletedAt: null }),
        createCategory({ id: "cat-2", deletedAt: new Date() }),
      ];
      mockRepository.findAll.mockResolvedValue(categories);

      // Act
      const result = await service.getAllCategories(true);

      // Assert
      expect(result).toEqual(categories);
      expect(mockRepository.findAll).toHaveBeenCalledWith(true);
    });
  });

  describe("createCategory", () => {
    it("should create a new category when key does not exist", async () => {
      // Arrange
      const input: CategoryCreateInput = {
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        iconName: "Wrench",
        description: "Servicios de plomería",
        sortOrder: 0,
        isActive: true,
      };
      const createdCategory = createCategory(input);
      mockRepository.findByKey.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdCategory);

      // Act
      const result = await service.createCategory(input);

      // Assert
      expect(result).toEqual(createdCategory);
      expect(mockRepository.findByKey).toHaveBeenCalledWith("PLUMBING", true);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it("should reactivate soft-deleted category when key exists but is deleted", async () => {
      // Arrange
      const input: CategoryCreateInput = {
        key: "PLUMBING",
        name: "Plomería Nueva",
        slug: "plomeria-nueva",
        iconName: "Wrench",
        sortOrder: 0,
        isActive: true,
      };
      const deletedCategory = createCategory({
        id: "cat-existing",
        key: "PLUMBING",
        deletedAt: new Date(),
      });
      const restoredCategory = createCategory({
        id: "cat-existing",
        key: "PLUMBING",
        deletedAt: null,
      });
      const updatedCategory = createCategory({
        id: "cat-existing",
        key: "PLUMBING",
        name: "Plomería Nueva",
        slug: "plomeria-nueva",
        deletedAt: null,
      });

      mockRepository.findByKey.mockResolvedValue(deletedCategory);
      mockRepository.restore.mockResolvedValue(restoredCategory);
      mockRepository.update.mockResolvedValue(updatedCategory);

      // Act
      const result = await service.createCategory(input);

      // Assert
      expect(result).toEqual(updatedCategory);
      expect(mockRepository.findByKey).toHaveBeenCalledWith("PLUMBING", true);
      expect(mockRepository.restore).toHaveBeenCalledWith("cat-existing");
      expect(mockRepository.update).toHaveBeenCalledWith("cat-existing", {
        name: input.name,
        slug: input.slug,
        iconName: input.iconName,
        description: input.description,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        configJson: input.configJson,
      });
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error when category with key already exists (not deleted)", async () => {
      // Arrange
      const input: CategoryCreateInput = {
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        sortOrder: 0,
        isActive: true,
      };
      const existingCategory = createCategory({
        key: "PLUMBING",
        deletedAt: null,
      });
      mockRepository.findByKey.mockResolvedValue(existingCategory);

      // Act & Assert
      await expect(service.createCategory(input)).rejects.toThrow(
        'Category with key "PLUMBING" already exists'
      );
      expect(mockRepository.findByKey).toHaveBeenCalledWith("PLUMBING", true);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should return restored category if update fails", async () => {
      // Arrange
      const input: CategoryCreateInput = {
        key: "PLUMBING",
        name: "Plomería Nueva",
        slug: "plomeria-nueva",
        sortOrder: 0,
        isActive: true,
      };
      const deletedCategory = createCategory({
        id: "cat-existing",
        key: "PLUMBING",
        deletedAt: new Date(),
      });
      const restoredCategory = createCategory({
        id: "cat-existing",
        key: "PLUMBING",
        deletedAt: null,
      });

      mockRepository.findByKey.mockResolvedValue(deletedCategory);
      mockRepository.restore.mockResolvedValue(restoredCategory);
      mockRepository.update.mockResolvedValue(null);

      // Act
      const result = await service.createCategory(input);

      // Assert
      expect(result).toEqual(restoredCategory);
      expect(mockRepository.restore).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it("should throw error if restore fails", async () => {
      // Arrange
      const input: CategoryCreateInput = {
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        sortOrder: 0,
        isActive: true,
      };
      const deletedCategory = createCategory({
        id: "cat-existing",
        key: "PLUMBING",
        deletedAt: new Date(),
      });

      mockRepository.findByKey.mockResolvedValue(deletedCategory);
      mockRepository.restore.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createCategory(input)).rejects.toThrow(
        "Failed to restore category"
      );
    });
  });

  describe("updateCategory", () => {
    it("should update category successfully", async () => {
      // Arrange
      const updateInput: CategoryUpdateInput = {
        name: "Plomería Actualizada",
        description: "Nueva descripción",
      };
      const updatedCategory = createCategory({
        name: "Plomería Actualizada",
        description: "Nueva descripción",
      });
      mockRepository.update.mockResolvedValue(updatedCategory);

      // Act
      const result = await service.updateCategory("cat-123", updateInput);

      // Assert
      expect(result).toEqual(updatedCategory);
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      expect(mockRepository.update).toHaveBeenCalledWith(
        "cat-123",
        updateInput
      );
    });

    it("should return null when category not found", async () => {
      // Arrange
      const updateInput: CategoryUpdateInput = { name: "New Name" };
      mockRepository.update.mockResolvedValue(null);

      // Act
      const result = await service.updateCategory("non-existent", updateInput);

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith(
        "non-existent",
        updateInput
      );
    });
  });

  describe("deleteCategory", () => {
    it("should soft delete category successfully", async () => {
      // Arrange
      const deletedCategory = createCategory({
        id: "cat-123",
        deletedAt: new Date(),
      });
      mockRepository.softDelete.mockResolvedValue(deletedCategory);

      // Act
      const result = await service.deleteCategory("cat-123");

      // Assert
      expect(result).toEqual(deletedCategory);
      expect(mockRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(mockRepository.softDelete).toHaveBeenCalledWith("cat-123");
    });

    it("should return null when category not found", async () => {
      // Arrange
      mockRepository.softDelete.mockResolvedValue(null);

      // Act
      const result = await service.deleteCategory("non-existent");

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.softDelete).toHaveBeenCalledWith("non-existent");
    });
  });

  describe("restoreCategory", () => {
    it("should restore soft-deleted category successfully", async () => {
      // Arrange
      const restoredCategory = createCategory({
        id: "cat-123",
        deletedAt: null,
      });
      mockRepository.restore.mockResolvedValue(restoredCategory);

      // Act
      const result = await service.restoreCategory("cat-123");

      // Assert
      expect(result).toEqual(restoredCategory);
      expect(mockRepository.restore).toHaveBeenCalledTimes(1);
      expect(mockRepository.restore).toHaveBeenCalledWith("cat-123");
    });

    it("should return null when category not found", async () => {
      // Arrange
      mockRepository.restore.mockResolvedValue(null);

      // Act
      const result = await service.restoreCategory("non-existent");

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.restore).toHaveBeenCalledWith("non-existent");
    });
  });
});
