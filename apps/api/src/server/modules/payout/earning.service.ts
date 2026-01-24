import { injectable, inject } from "tsyringe";
import type { EarningRepository } from "./earning.repo";
import type { BookingRepository } from "@modules/booking/booking.repo";
import type { PaymentRepository } from "@modules/payment/payment.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import { BookingStatus, PaymentStatus, Role } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { TOKENS } from "@/server/container/tokens";
import { PLATFORM_FEE_RATE, computeAvailableAt } from "./config";
import { BookingNotFoundError } from "@modules/booking/booking.errors";

/**
 * Error thrown when earning cannot be created
 */
export class EarningCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EarningCreationError";
  }
}

/**
 * Pro earning output
 * Represents an earning as returned to a pro user
 */
export interface ProEarning {
  id: string;
  bookingId: string;
  bookingDisplayId: string;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  status: "PENDING" | "PAYABLE" | "PAID" | "REVERSED";
  currency: string;
  availableAt: Date | null;
  createdAt: Date;
}

/**
 * Earning service
 * Contains business logic for earning operations
 */
@injectable()
export class EarningService {
  constructor(
    @inject(TOKENS.EarningRepository)
    private readonly earningRepository: EarningRepository,
    @inject(TOKENS.BookingRepository)
    private readonly bookingRepository: BookingRepository,
    @inject(TOKENS.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository
  ) {}

  /**
   * Create an earning record for a completed booking with captured payment
   * Rules:
   * - booking must exist
   * - booking status must be COMPLETED
   * - payment for booking must be CAPTURED
   * - earning must not already exist for bookingId
   * - compute amounts: grossAmount, platformFeeAmount, netAmount
   * - set status=PENDING and availableAt = now + coolingOff
   */
  async createEarningForCompletedBooking(
    actorOrSystem: Actor | { role: "SYSTEM" },
    bookingId: string
  ): Promise<void> {
    // Get booking
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Validate booking status is COMPLETED
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new EarningCreationError(
        `Booking ${bookingId} must be COMPLETED to create earning. Current status: ${booking.status}`
      );
    }

    // Check if earning already exists
    const existingEarning =
      await this.earningRepository.findByBookingId(bookingId);
    if (existingEarning) {
      // Idempotent: if earning already exists, skip creation
      return;
    }

    // Get payment for booking
    const payment = await this.paymentRepository.findByBookingId(bookingId);
    if (!payment) {
      throw new EarningCreationError(
        `No payment found for booking ${bookingId}`
      );
    }

    // Validate payment status is CAPTURED
    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new EarningCreationError(
        `Payment for booking ${bookingId} must be CAPTURED to create earning. Current status: ${payment.status}`
      );
    }

    // Validate payment has captured amount
    if (!payment.amountCaptured || payment.amountCaptured <= 0) {
      throw new EarningCreationError(
        `Payment for booking ${bookingId} has no captured amount`
      );
    }

    // Validate booking has proProfileId
    if (!booking.proProfileId) {
      throw new EarningCreationError(
        `Booking ${bookingId} has no proProfileId`
      );
    }

    // Compute amounts
    const grossAmount = payment.amountCaptured;
    const platformFeeAmount = Math.round(grossAmount * PLATFORM_FEE_RATE);
    const netAmount = grossAmount - platformFeeAmount;

    // Compute availableAt (now + cooling-off)
    const availableAt = computeAvailableAt();

    // Create earning
    await this.earningRepository.createFromBooking({
      bookingId,
      proProfileId: booking.proProfileId,
      clientUserId: booking.clientUserId,
      currency: payment.currency,
      grossAmount,
      platformFeeAmount,
      netAmount,
      availableAt,
    });
  }

  /**
   * Mark all due earnings as PAYABLE
   * Moves all earnings with status=PENDING and availableAt <= now to PAYABLE
   * Idempotent operation
   */
  async markPayableIfDue(now: Date = new Date()): Promise<number> {
    // Find all PENDING earnings that are due (availableAt <= now)
    // Note: listPayableByPro filters by PAYABLE status, so we need to query differently
    // We'll use a different approach: query PENDING earnings and filter by availableAt

    // Since we don't have a direct query method, we'll need to add one to the repository
    // For now, let's use markManyStatus after finding the IDs
    // Actually, let's check the repository interface again...

    // The repository has listPayableByPro which filters by PAYABLE status,
    // but we need to find PENDING earnings with availableAt <= now
    // We need to add a method to find pending earnings due, or we can query all and filter

    // For MVP, let's add a helper method to the repository
    // But wait, the requirement says to use existing methods if possible

    // Actually, looking at the requirement again: "moves all earnings with status=PENDING and availableAt <= now to PAYABLE"
    // We need to query PENDING earnings where availableAt <= now

    // Since the repository doesn't have this exact query, we'll need to add it
    // But the requirement says to use existing repositories... Let me check if we can work around it

    // Actually, I think we need to add a method to the repository for this
    // But let's implement it in the service using a workaround first, then we can optimize

    // For now, let's implement markPayableIfDue by querying the database directly
    // But that violates the "no Prisma outside repos" rule

    // Let me add a method to the repository interface for this specific use case
    // Actually, let me check the earning.repo.ts again to see what methods exist

    // Looking at the interface, we have:
    // - createFromBooking
    // - findByBookingId
    // - listPayableByPro (filters by PAYABLE status)
    // - markStatus
    // - markManyStatus

    const pendingDueEarnings = await this.earningRepository.listPendingDue(now);

    if (pendingDueEarnings.length === 0) {
      return 0;
    }

    // Mark all as PAYABLE
    const ids = pendingDueEarnings.map((e) => e.id);
    await this.earningRepository.markManyStatus(ids, "PAYABLE");

    return ids.length;
  }

  /**
   * Get earnings for a pro
   * Returns list of earnings with optional filtering
   */
  async getEarningsForPro(
    actor: Actor,
    options?: {
      status?: "PENDING" | "PAYABLE" | "PAID" | "REVERSED";
      limit?: number;
      offset?: number;
    }
  ): Promise<ProEarning[]> {
    // Authorization: Actor must be a pro
    if (actor.role !== Role.PRO) {
      throw new EarningCreationError("Only pros can access earnings");
    }

    // Get pro profile for actor
    const proProfile = await this.proRepository.findByUserId(actor.id);
    if (!proProfile) {
      throw new EarningCreationError("Pro profile not found");
    }

    const earnings = await this.earningRepository.listByProProfileId(
      proProfile.id,
      {
        status: options?.status,
        limit: options?.limit,
        offset: options?.offset,
      }
    );

    return earnings.map((earning) => ({
      id: earning.id,
      bookingId: earning.bookingId,
      bookingDisplayId: earning.bookingDisplayId || earning.bookingId.slice(-6), // Fallback to last 6 chars if no displayId
      grossAmount: earning.grossAmount,
      platformFeeAmount: earning.platformFeeAmount,
      netAmount: earning.netAmount,
      status: earning.status,
      currency: earning.currency,
      availableAt: earning.availableAt,
      createdAt: earning.createdAt,
    }));
  }
}
