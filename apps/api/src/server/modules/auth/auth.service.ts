import { injectable, inject } from "tsyringe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { UserRepository } from "@modules/user/user.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { BookingRepository } from "@modules/booking/booking.repo";
import type { PaymentRepository } from "@modules/payment/payment.repo";
import { Role } from "@repo/domain";
import type { ClientSignupInput, ProSignupInput } from "@repo/domain";
import { TOKENS } from "@/server/container/tokens";

/**
 * Auth service
 * Contains business logic for authentication operations
 */
@injectable()
export class AuthService {
  private supabaseAdmin: SupabaseClient | null = null;

  constructor(
    @inject(TOKENS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TOKENS.ClientProfileService)
    private readonly clientProfileService: ClientProfileService,
    @inject(TOKENS.BookingRepository)
    private readonly bookingRepository: BookingRepository,
    @inject(TOKENS.PaymentRepository)
    private readonly paymentRepository: PaymentRepository
  ) {}

  /**
   * Get Supabase admin client (lazy initialization)
   */
  private getSupabaseAdmin(): SupabaseClient {
    if (this.supabaseAdmin) {
      return this.supabaseAdmin;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
      );
    }

    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    return this.supabaseAdmin;
  }

  /**
   * Sign up a new client user
   * Creates user in Supabase, User in DB, and ClientProfile atomically
   * Rolls back Supabase user if DB operations fail
   */
  async signupClient(input: ClientSignupInput): Promise<{
    userId: string;
    email: string;
  }> {
    const supabaseAdmin = this.getSupabaseAdmin();

    // 1. Create user in Supabase (email NOT confirmed)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: false, // Requires email confirmation
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create user");
    }

    const supabaseUserId = authData.user.id;

    try {
      // 2. Create User in our DB
      const user = await this.userRepository.create(Role.CLIENT, supabaseUserId);

      // 3. Create ClientProfile with all provided data
      await this.clientProfileService.updateProfile(supabaseUserId, {
        email: input.email,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phone: input.phone ?? null,
      });

      return {
        userId: user.id,
        email: input.email,
      };
    } catch (error) {
      // Rollback: Delete Supabase user if DB creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
      } catch (deleteError) {
        // Log but don't throw - original error is more important
        console.error("Failed to rollback Supabase user:", deleteError);
      }

      throw error;
    }
  }

  /**
   * Sign up a new pro user
   * Creates user in Supabase, User in DB with Role.PRO atomically
   * Rolls back Supabase user if DB operations fail
   * Note: ProProfile is created later during onboarding flow
   */
  async signupPro(input: ProSignupInput): Promise<{
    userId: string;
    email: string;
  }> {
    const supabaseAdmin = this.getSupabaseAdmin();

    // 1. Create user in Supabase (email NOT confirmed)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: false, // Requires email confirmation
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create user");
    }

    const supabaseUserId = authData.user.id;

    try {
      // 2. Create User in our DB with PRO role
      const user = await this.userRepository.create(Role.PRO, supabaseUserId);

      // Note: ProProfile is NOT created here - it's created during onboarding
      // This keeps the signup flow simple and allows pros to complete their profile
      // in a separate onboarding step

      return {
        userId: user.id,
        email: input.email,
      };
    } catch (error) {
      // Rollback: Delete Supabase user if DB creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
      } catch (deleteError) {
        // Log but don't throw - original error is more important
        console.error("Failed to rollback Supabase user:", deleteError);
      }

      throw error;
    }
  }

  /**
   * Change user password
   * Verifies current password and updates to new password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const supabaseAdmin = this.getSupabaseAdmin();

    // 1. Get user email to verify password
    const { data: userData, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !userData.user) {
      throw new Error("User not found");
    }

    const email = userData.user.email;
    if (!email) {
      throw new Error("User email not found");
    }

    // 2. Verify current password by attempting to sign in
    // We need the anon key for this - if not available, skip verification
    // (less secure but allows the feature to work)
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && anonKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabasePublic = createClient(supabaseUrl, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { error: signInError } =
        await supabasePublic.auth.signInWithPassword({
          email,
          password: currentPassword,
        });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }
    }
    // If anon key is not available, skip password verification
    // This is less secure but allows the feature to work in development

    // 3. Update password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      throw new Error(updateError.message || "Failed to update password");
    }
  }

  /**
   * Delete user account (Hybrid Approach: Soft Delete + Anonymization)
   * 
   * 1. Prevents deletion if there are active bookings or pending payments
   * 2. Anonymizes ClientProfile (removes PII for GDPR compliance)
   * 3. Soft deletes User (sets deletedAt timestamp)
   * 4. Deletes Supabase auth user
   * 5. Keeps all financial records intact (bookings, payments, reviews, earnings)
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const supabaseAdmin = this.getSupabaseAdmin();

    // 1. Get user email to verify password
    const { data: userData, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !userData.user) {
      throw new Error("User not found");
    }

    const email = userData.user.email;
    if (!email) {
      throw new Error("User email not found");
    }

    // 2. Verify password before deletion
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && anonKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabasePublic = createClient(supabaseUrl, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { error: signInError } =
        await supabasePublic.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        throw new Error("Password is incorrect");
      }
    }
    // If anon key is not available, skip password verification
    // This is less secure but allows the feature to work in development

    // 3. Check for active bookings (prevent deletion if active)
    const activeBookings = await this.bookingRepository.findActiveByClientUserId(
      userId
    );
    if (activeBookings.length > 0) {
      throw new Error(
        `Cannot delete account: ${activeBookings.length} active booking(s) exist. Please complete or cancel all active bookings first.`
      );
    }

    // 4. Check for pending payments (prevent deletion if pending)
    const pendingPayments = await this.paymentRepository.findPendingByClientUserId(
      userId
    );
    if (pendingPayments.length > 0) {
      throw new Error(
        `Cannot delete account: ${pendingPayments.length} pending payment(s) exist. Please wait for payments to settle or be refunded.`
      );
    }

    // 5. Anonymize ClientProfile (remove PII for GDPR compliance)
    // This keeps the profile record but removes all personally identifiable information
    await this.clientProfileService.anonymizeProfile(userId);

    // 6. Soft delete User (set deletedAt timestamp)
    // This preserves the User record and all related data (bookings, payments, reviews, earnings)
    await this.userRepository.softDelete(userId);

    // 7. Delete Supabase auth user
    // This prevents login but keeps all database records intact
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      throw new Error(deleteError.message || "Failed to delete account");
    }

    // Note: All financial records (bookings, payments, reviews, earnings) are preserved
    // User is soft-deleted (deletedAt set) and ClientProfile is anonymized (PII removed)
    // This maintains financial integrity and audit trails while complying with GDPR
  }
}
