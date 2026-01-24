import { describe, it, expect, beforeEach, vi } from "vitest";
import { ClientProfileService } from "../clientProfile.service";
import type { ClientProfileEntity } from "../clientProfile.repo";

describe("ClientProfileService", () => {
  let service: ClientProfileService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  function createMockRepository(): {
    findByUserId: ReturnType<typeof vi.fn>;
    createForUser: ReturnType<typeof vi.fn>;
    upsertForUser: ReturnType<typeof vi.fn>;
  } {
    return {
      findByUserId: vi.fn(),
      createForUser: vi.fn(),
      upsertForUser: vi.fn(),
    };
  }

  function createMockProfile(
    overrides?: Partial<ClientProfileEntity>
  ): ClientProfileEntity {
    return {
      id: "profile-1",
      userId: "user-1",
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      preferredContactMethod: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new ClientProfileService(
      mockRepository as unknown as import("../clientProfile.repo").ClientProfileRepository
    );
  });

  describe("ensureClientProfileExists", () => {
    it("should return existing profile when profile exists", async () => {
      // Arrange
      const userId = "user-1";
      const existingProfile = createMockProfile({
        userId,
        email: "test@example.com",
      });
      mockRepository.findByUserId.mockResolvedValue(existingProfile);

      // Act
      const result = await service.ensureClientProfileExists(userId);

      // Assert
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.createForUser).not.toHaveBeenCalled();
      expect(result).toEqual(existingProfile);
    });

    it("should create new profile when profile does not exist", async () => {
      // Arrange
      const userId = "user-2";
      const newProfile = createMockProfile({ userId });
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.createForUser.mockResolvedValue(newProfile);

      // Act
      const result = await service.ensureClientProfileExists(userId);

      // Assert
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.createForUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(newProfile);
    });

    it("should not create duplicate profile if profile exists", async () => {
      // Arrange
      const userId = "user-3";
      const existingProfile = createMockProfile({ userId });
      mockRepository.findByUserId.mockResolvedValue(existingProfile);

      // Act
      await service.ensureClientProfileExists(userId);

      // Assert
      expect(mockRepository.findByUserId).toHaveBeenCalledTimes(1);
      expect(mockRepository.createForUser).not.toHaveBeenCalled();
    });
  });

  describe("getProfile", () => {
    it("should return existing profile when found", async () => {
      // Arrange
      const userId = "user-1";
      const existingProfile = createMockProfile({ userId, firstName: "John" });
      mockRepository.findByUserId.mockResolvedValue(existingProfile);

      // Act
      const result = await service.getProfile(userId);

      // Assert
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.createForUser).not.toHaveBeenCalled();
      expect(result).toEqual(existingProfile);
    });

    it("should create profile when not found", async () => {
      // Arrange
      const userId = "user-2";
      const newProfile = createMockProfile({ userId });
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.createForUser.mockResolvedValue(newProfile);

      // Act
      const result = await service.getProfile(userId);

      // Assert
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.createForUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(newProfile);
    });

    it("should return profile with all fields", async () => {
      // Arrange
      const userId = "user-3";
      const profile = createMockProfile({
        userId,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: "+1234567890",
        preferredContactMethod: "EMAIL",
      });
      mockRepository.findByUserId.mockResolvedValue(profile);

      // Act
      const result = await service.getProfile(userId);

      // Assert
      expect(result).toMatchObject({
        id: profile.id,
        userId: profile.userId,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: "+1234567890",
        preferredContactMethod: "EMAIL",
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("getProfileByUserId", () => {
    it("should return profile when found", async () => {
      // Arrange
      const userId = "user-1";
      const profile = createMockProfile({ userId });
      mockRepository.findByUserId.mockResolvedValue(profile);

      // Act
      const result = await service.getProfileByUserId(userId);

      // Assert
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(profile);
    });

    it("should return null when profile not found", async () => {
      // Arrange
      const userId = "user-2";
      mockRepository.findByUserId.mockResolvedValue(null);

      // Act
      const result = await service.getProfileByUserId(userId);

      // Assert
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it("should not create profile when not found (unlike getProfile)", async () => {
      // Arrange
      const userId = "user-3";
      mockRepository.findByUserId.mockResolvedValue(null);

      // Act
      await service.getProfileByUserId(userId);

      // Assert
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.createForUser).not.toHaveBeenCalled();
    });
  });

  describe("updateProfile", () => {
    it("should update profile with provided data", async () => {
      // Arrange
      const userId = "user-1";
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        email: "updated@example.com",
      };
      const updatedProfile = createMockProfile({
        userId,
        ...updateData,
      });
      mockRepository.upsertForUser.mockResolvedValue(updatedProfile);

      // Act
      const result = await service.updateProfile(userId, updateData);

      // Assert
      expect(mockRepository.upsertForUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result).toEqual(updatedProfile);
    });

    it("should update only provided fields", async () => {
      // Arrange
      const userId = "user-2";
      const updateData = {
        email: "newemail@example.com",
      };
      const updatedProfile = createMockProfile({
        userId,
        firstName: "Existing",
        email: "newemail@example.com",
      });
      mockRepository.upsertForUser.mockResolvedValue(updatedProfile);

      // Act
      const result = await service.updateProfile(userId, updateData);

      // Assert
      expect(mockRepository.upsertForUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result.email).toBe("newemail@example.com");
    });

    it("should handle null values for optional fields", async () => {
      // Arrange
      const userId = "user-3";
      const updateData = {
        firstName: null,
        lastName: null,
        phone: null,
      };
      const updatedProfile = createMockProfile({
        userId,
        firstName: null,
        lastName: null,
        phone: null,
      });
      mockRepository.upsertForUser.mockResolvedValue(updatedProfile);

      // Act
      const result = await service.updateProfile(userId, updateData);

      // Assert
      expect(mockRepository.upsertForUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.phone).toBeNull();
    });

    it("should update preferredContactMethod", async () => {
      // Arrange
      const userId = "user-4";
      const updateData = {
        preferredContactMethod: "WHATSAPP" as const,
      };
      const updatedProfile = createMockProfile({
        userId,
        preferredContactMethod: "WHATSAPP",
      });
      mockRepository.upsertForUser.mockResolvedValue(updatedProfile);

      // Act
      const result = await service.updateProfile(userId, updateData);

      // Assert
      expect(mockRepository.upsertForUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result.preferredContactMethod).toBe("WHATSAPP");
    });
  });
});
