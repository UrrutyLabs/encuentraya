import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthService } from "../auth.service";
import type { UserRepository } from "@modules/user/user.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { OrderRepository } from "@modules/order/order.repo";
import type { PaymentRepository } from "@modules/payment/payment.repo";
import { Role } from "@repo/domain";

// Mock Supabase
type MockSupabaseAdminClient = {
  auth: {
    admin: {
      createUser: ReturnType<typeof vi.fn>;
      deleteUser: ReturnType<typeof vi.fn>;
      getUserById: ReturnType<typeof vi.fn>;
      updateUserById: ReturnType<typeof vi.fn>;
    };
    getUser: ReturnType<typeof vi.fn>;
  };
};

type MockSupabasePublicClient = {
  auth: {
    resetPasswordForEmail: ReturnType<typeof vi.fn>;
    verifyOtp: ReturnType<typeof vi.fn>;
  };
};

vi.mock("@supabase/supabase-js", () => {
  const mockSupabaseAdminClient: MockSupabaseAdminClient = {
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
        getUserById: vi.fn(),
        updateUserById: vi.fn(),
      },
      getUser: vi.fn(),
    },
  };

  const mockSupabasePublicClient: MockSupabasePublicClient = {
    auth: {
      resetPasswordForEmail: vi.fn(),
      verifyOtp: vi.fn(),
    },
  };

  // Track which client type to return based on key used
  let usePublicClient = false;

  return {
    createClient: vi.fn((url: string, key: string) => {
      // If anon key is used, return public client; otherwise admin client
      usePublicClient = key !== "test-service-role-key";
      return usePublicClient
        ? (mockSupabasePublicClient as unknown as MockSupabaseAdminClient)
        : mockSupabaseAdminClient;
    }) as (
      url: string,
      key: string
    ) => MockSupabaseAdminClient | MockSupabasePublicClient,
  };
});

// Import after mock to get the mocked version
import { createClient } from "@supabase/supabase-js";

describe("AuthService", () => {
  let service: AuthService;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockClientProfileService: ReturnType<
    typeof createMockClientProfileService
  >;
  let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
  let mockPaymentRepository: ReturnType<typeof createMockPaymentRepository>;
  let mockSupabaseAdminClient: MockSupabaseAdminClient;
  let mockSupabasePublicClient: MockSupabasePublicClient;

  function createMockUserRepository(): {
    create: ReturnType<typeof vi.fn>;
  } {
    return {
      create: vi.fn(),
    };
  }

  function createMockClientProfileService(): {
    updateProfile: ReturnType<typeof vi.fn>;
    anonymizeProfile: ReturnType<typeof vi.fn>;
  } {
    return {
      updateProfile: vi.fn(),
      anonymizeProfile: vi.fn(),
    };
  }

  function createMockOrderRepository(): {
    findActiveByClientUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      findActiveByClientUserId: vi.fn(),
    };
  }

  function createMockPaymentRepository(): {
    findPendingByClientUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      findPendingByClientUserId: vi.fn(),
    };
  }

  beforeEach(() => {
    // Set up environment variables
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.CLIENT_APP_URL = "http://localhost:3000";

    mockUserRepository = createMockUserRepository();
    mockClientProfileService = createMockClientProfileService();
    mockOrderRepository = createMockOrderRepository();
    mockPaymentRepository = createMockPaymentRepository();

    // Get mocked Supabase clients
    mockSupabaseAdminClient = createClient(
      "https://test.supabase.co",
      "test-service-role-key"
    ) as unknown as MockSupabaseAdminClient;
    mockSupabasePublicClient = createClient(
      "https://test.supabase.co",
      "test-anon-key"
    ) as unknown as MockSupabasePublicClient;

    service = new AuthService(
      mockUserRepository as unknown as UserRepository,
      mockClientProfileService as unknown as ClientProfileService,
      mockOrderRepository as unknown as OrderRepository,
      mockPaymentRepository as unknown as PaymentRepository
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signupClient", () => {
    it("should create client user in Supabase, DB, and profile", async () => {
      // Arrange
      const input = {
        email: "client@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890",
      };
      const supabaseUserId = "supabase-user-1";
      const dbUser = {
        id: supabaseUserId,
        role: Role.CLIENT,
        createdAt: new Date(),
      };

      mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: supabaseUserId } },
        error: null,
      });
      mockUserRepository.create.mockResolvedValue(dbUser);
      mockClientProfileService.updateProfile.mockResolvedValue({
        id: "profile-1",
        userId: supabaseUserId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        preferredContactMethod: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.signupClient(input);

      // Assert
      expect(
        mockSupabaseAdminClient.auth.admin.createUser
      ).toHaveBeenCalledWith({
        email: input.email,
        password: input.password,
        email_confirm: false,
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        Role.CLIENT,
        supabaseUserId
      );
      expect(mockClientProfileService.updateProfile).toHaveBeenCalledWith(
        supabaseUserId,
        {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        }
      );
      expect(result).toEqual({
        userId: supabaseUserId,
        email: input.email,
      });
    });

    it("should rollback Supabase user if DB creation fails", async () => {
      // Arrange
      const input = {
        email: "client@example.com",
        password: "password123",
      };
      const supabaseUserId = "supabase-user-1";
      const dbError = new Error("Database error");

      mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: supabaseUserId } },
        error: null,
      });
      mockUserRepository.create.mockRejectedValue(dbError);
      mockSupabaseAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      // Act & Assert
      await expect(service.signupClient(input)).rejects.toThrow(
        "Database error"
      );

      // Should attempt to delete Supabase user
      expect(
        mockSupabaseAdminClient.auth.admin.deleteUser
      ).toHaveBeenCalledWith(supabaseUserId);
    });

    it("should throw error when Supabase user creation fails", async () => {
      // Arrange
      const input = {
        email: "client@example.com",
        password: "password123",
      };
      const supabaseError = { message: "Email already exists" };

      mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(service.signupClient(input)).rejects.toThrow(
        "Email already exists"
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it("should handle optional fields in client signup", async () => {
      // Arrange
      const input = {
        email: "client@example.com",
        password: "password123",
        // No firstName, lastName, phone
      };
      const supabaseUserId = "supabase-user-1";
      const dbUser = {
        id: supabaseUserId,
        role: Role.CLIENT,
        createdAt: new Date(),
      };

      mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: supabaseUserId } },
        error: null,
      });
      mockUserRepository.create.mockResolvedValue(dbUser);
      mockClientProfileService.updateProfile.mockResolvedValue({
        id: "profile-1",
        userId: supabaseUserId,
        email: input.email,
        firstName: null,
        lastName: null,
        phone: null,
        preferredContactMethod: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.signupClient(input);

      // Assert
      expect(mockClientProfileService.updateProfile).toHaveBeenCalledWith(
        supabaseUserId,
        {
          email: input.email,
          firstName: null,
          lastName: null,
          phone: null,
        }
      );
      expect(result).toEqual({
        userId: supabaseUserId,
        email: input.email,
      });
    });
  });

  describe("signupPro", () => {
    it("should create pro user in Supabase and DB", async () => {
      // Arrange
      const input = {
        email: "pro@example.com",
        password: "password123",
      };
      const supabaseUserId = "supabase-pro-1";
      const dbUser = {
        id: supabaseUserId,
        role: Role.PRO,
        createdAt: new Date(),
      };

      mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: supabaseUserId } },
        error: null,
      });
      mockUserRepository.create.mockResolvedValue(dbUser);

      // Act
      const result = await service.signupPro(input);

      // Assert
      expect(
        mockSupabaseAdminClient.auth.admin.createUser
      ).toHaveBeenCalledWith({
        email: input.email,
        password: input.password,
        email_confirm: false,
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        Role.PRO,
        supabaseUserId
      );
      expect(mockClientProfileService.updateProfile).not.toHaveBeenCalled();
      expect(result).toEqual({
        userId: supabaseUserId,
        email: input.email,
      });
    });

    it("should rollback Supabase user if DB creation fails", async () => {
      // Arrange
      const input = {
        email: "pro@example.com",
        password: "password123",
      };
      const supabaseUserId = "supabase-pro-1";
      const dbError = new Error("Database error");

      mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: supabaseUserId } },
        error: null,
      });
      mockUserRepository.create.mockRejectedValue(dbError);
      mockSupabaseAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      // Act & Assert
      await expect(service.signupPro(input)).rejects.toThrow("Database error");

      // Should attempt to delete Supabase user
      expect(
        mockSupabaseAdminClient.auth.admin.deleteUser
      ).toHaveBeenCalledWith(supabaseUserId);
    });

    it("should not create ProProfile during signup", async () => {
      // Arrange
      const input = {
        email: "pro@example.com",
        password: "password123",
      };
      const supabaseUserId = "supabase-pro-1";
      const dbUser = {
        id: supabaseUserId,
        role: Role.PRO,
        createdAt: new Date(),
      };

      mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: supabaseUserId } },
        error: null,
      });
      mockUserRepository.create.mockResolvedValue(dbUser);

      // Act
      await service.signupPro(input);

      // Assert - ProProfile should NOT be created (that happens in onboarding)
      expect(mockClientProfileService.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe("requestPasswordReset", () => {
    it("should send password reset email using public client", async () => {
      // Arrange
      const email = "user@example.com";

      mockSupabasePublicClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      // Act
      await service.requestPasswordReset(email);

      // Assert
      expect(
        mockSupabasePublicClient.auth.resetPasswordForEmail
      ).toHaveBeenCalledWith(email, {
        redirectTo: "http://localhost:3000/reset-password",
      });
    });

    it("should not throw error even if email doesn't exist (security)", async () => {
      // Arrange
      const email = "nonexistent@example.com";

      mockSupabasePublicClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: "User not found" },
      });

      // Act & Assert - should not throw
      await expect(service.requestPasswordReset(email)).resolves.not.toThrow();
    });

    it("should use CLIENT_APP_URL from environment", async () => {
      // Arrange
      const email = "user@example.com";
      process.env.CLIENT_APP_URL = "https://myapp.com";

      mockSupabasePublicClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      // Act
      await service.requestPasswordReset(email);

      // Assert
      expect(
        mockSupabasePublicClient.auth.resetPasswordForEmail
      ).toHaveBeenCalledWith(email, {
        redirectTo: "https://myapp.com/reset-password",
      });

      // Cleanup
      process.env.CLIENT_APP_URL = "http://localhost:3000";
    });

    it("should throw error if Supabase configuration is missing", async () => {
      // Arrange
      const email = "user@example.com";
      const originalUrl = process.env.SUPABASE_URL;
      const originalKey = process.env.SUPABASE_ANON_KEY;

      delete process.env.SUPABASE_URL;

      // Act & Assert
      await expect(service.requestPasswordReset(email)).rejects.toThrow(
        "Missing Supabase configuration"
      );

      // Restore
      process.env.SUPABASE_URL = originalUrl;
      process.env.SUPABASE_ANON_KEY = originalKey;
    });
  });

  describe("resetPassword", () => {
    it("should verify token and update password", async () => {
      // Arrange
      const accessToken = "valid-access-token";
      const newPassword = "newPassword123";
      const userId = "user-123";

      mockSupabaseAdminClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: "user@example.com",
          },
        },
        error: null,
      });

      mockSupabaseAdminClient.auth.admin.updateUserById.mockResolvedValue({
        data: {
          user: {
            id: userId,
          },
        },
        error: null,
      });

      // Act
      await service.resetPassword(accessToken, newPassword);

      // Assert
      expect(mockSupabaseAdminClient.auth.getUser).toHaveBeenCalledWith(
        accessToken
      );
      expect(
        mockSupabaseAdminClient.auth.admin.updateUserById
      ).toHaveBeenCalledWith(userId, {
        password: newPassword,
      });
    });

    it("should throw error if token is invalid", async () => {
      // Arrange
      const accessToken = "invalid-token";
      const newPassword = "newPassword123";

      mockSupabaseAdminClient.auth.getUser.mockResolvedValue({
        data: {
          user: null,
        },
        error: { message: "Invalid token" },
      });

      // Act & Assert
      await expect(
        service.resetPassword(accessToken, newPassword)
      ).rejects.toThrow("Invalid or expired reset token");

      expect(
        mockSupabaseAdminClient.auth.admin.updateUserById
      ).not.toHaveBeenCalled();
    });

    it("should throw error if token is expired", async () => {
      // Arrange
      const accessToken = "expired-token";
      const newPassword = "newPassword123";

      mockSupabaseAdminClient.auth.getUser.mockResolvedValue({
        data: {
          user: null,
        },
        error: { message: "Token expired" },
      });

      // Act & Assert
      await expect(
        service.resetPassword(accessToken, newPassword)
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should throw error if password update fails", async () => {
      // Arrange
      const accessToken = "valid-access-token";
      const newPassword = "newPassword123";
      const userId = "user-123";

      mockSupabaseAdminClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: "user@example.com",
          },
        },
        error: null,
      });

      mockSupabaseAdminClient.auth.admin.updateUserById.mockResolvedValue({
        data: {
          user: null,
        },
        error: { message: "Password update failed" },
      });

      // Act & Assert
      await expect(
        service.resetPassword(accessToken, newPassword)
      ).rejects.toThrow("Password update failed");
    });

    it("should throw error if Supabase configuration is missing", async () => {
      // Arrange
      const accessToken = "valid-token";
      const newPassword = "newPassword123";
      const originalUrl = process.env.SUPABASE_URL;
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      delete process.env.SUPABASE_URL;

      // Act & Assert
      await expect(
        service.resetPassword(accessToken, newPassword)
      ).rejects.toThrow("Missing Supabase configuration");

      // Restore
      process.env.SUPABASE_URL = originalUrl;
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    });
  });

  describe("resetPasswordWithOtp", () => {
    it("should verify OTP and update password", async () => {
      // Arrange
      const email = "user@example.com";
      const otp = "123456";
      const newPassword = "newPassword123";
      const userId = "user-123";

      mockSupabasePublicClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: email,
          },
        },
        error: null,
      });

      mockSupabaseAdminClient.auth.admin.updateUserById.mockResolvedValue({
        data: {
          user: {
            id: userId,
          },
        },
        error: null,
      });

      // Act
      await service.resetPasswordWithOtp(email, otp, newPassword);

      // Assert
      expect(mockSupabasePublicClient.auth.verifyOtp).toHaveBeenCalledWith({
        email,
        token: otp,
        type: "recovery",
      });
      expect(
        mockSupabaseAdminClient.auth.admin.updateUserById
      ).toHaveBeenCalledWith(userId, {
        password: newPassword,
      });
    });

    it("should throw error if OTP is invalid", async () => {
      // Arrange
      const email = "user@example.com";
      const otp = "invalid-otp";
      const newPassword = "newPassword123";

      mockSupabasePublicClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: null,
        },
        error: { message: "Invalid OTP" },
      });

      // Act & Assert
      await expect(
        service.resetPasswordWithOtp(email, otp, newPassword)
      ).rejects.toThrow("Invalid or expired OTP code");

      expect(
        mockSupabaseAdminClient.auth.admin.updateUserById
      ).not.toHaveBeenCalled();
    });

    it("should throw error if OTP is expired", async () => {
      // Arrange
      const email = "user@example.com";
      const otp = "expired-otp";
      const newPassword = "newPassword123";

      mockSupabasePublicClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: null,
        },
        error: { message: "OTP expired" },
      });

      // Act & Assert
      await expect(
        service.resetPasswordWithOtp(email, otp, newPassword)
      ).rejects.toThrow("Invalid or expired OTP code");
    });

    it("should throw error if password update fails", async () => {
      // Arrange
      const email = "user@example.com";
      const otp = "123456";
      const newPassword = "newPassword123";
      const userId = "user-123";

      mockSupabasePublicClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: email,
          },
        },
        error: null,
      });

      mockSupabaseAdminClient.auth.admin.updateUserById.mockResolvedValue({
        data: {
          user: null,
        },
        error: { message: "Password update failed" },
      });

      // Act & Assert
      await expect(
        service.resetPasswordWithOtp(email, otp, newPassword)
      ).rejects.toThrow("Password update failed");
    });

    it("should throw error if Supabase configuration is missing", async () => {
      // Arrange
      const email = "user@example.com";
      const otp = "123456";
      const newPassword = "newPassword123";
      const originalUrl = process.env.SUPABASE_URL;
      const originalKey = process.env.SUPABASE_ANON_KEY;

      delete process.env.SUPABASE_URL;

      // Act & Assert
      await expect(
        service.resetPasswordWithOtp(email, otp, newPassword)
      ).rejects.toThrow("Missing Supabase configuration");

      // Restore
      process.env.SUPABASE_URL = originalUrl;
      process.env.SUPABASE_ANON_KEY = originalKey;
    });
  });
});
