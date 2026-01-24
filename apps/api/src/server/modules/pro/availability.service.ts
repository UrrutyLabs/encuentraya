import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type { AvailabilityRepository } from "./availability.repo";
import type {
  AvailabilitySlot,
  UpdateAvailabilitySlotsInput,
} from "@repo/domain";

/**
 * Availability service
 * Contains business logic for pro availability operations
 */
@injectable()
export class AvailabilityService {
  constructor(
    @inject(TOKENS.AvailabilityRepository)
    private readonly availabilityRepository: AvailabilityRepository
  ) {}

  /**
   * Check if a pro is available at a specific date and time
   * @param proId - The pro profile ID
   * @param date - The requested date
   * @param time - The requested time in "HH:MM" format
   * @returns true if the pro has availability slots that match the date/time
   */
  async isProAvailableAtDateTime(
    proId: string,
    date: Date,
    time: string
  ): Promise<boolean> {
    // Get day of week in UTC (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Use UTC to match the date selected by the user regardless of server timezone
    const dayOfWeek = date.getUTCDay();

    // Get all availability slots for this pro
    const slots = await this.availabilityRepository.findByProProfileId(proId);

    // Filter slots for the requested day
    const daySlots = slots.filter((slot) => slot.dayOfWeek === dayOfWeek);

    if (daySlots.length === 0) {
      return false;
    }

    // Check if the requested time falls within any slot's time range
    // Time format is "HH:MM" (e.g., "09:00", "17:00")
    const requestedTime = time;

    return daySlots.some((slot) => {
      // Compare times as strings (works because "HH:MM" format is lexicographically sortable)
      return requestedTime >= slot.startTime && requestedTime <= slot.endTime;
    });
  }

  /**
   * Check if a pro is available on a specific day of week
   * @param proId - The pro profile ID
   * @param date - The requested date
   * @returns true if the pro has availability slots for that day of week
   */
  async isProAvailableOnDay(proId: string, date: Date): Promise<boolean> {
    // Get day of week in UTC (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Use UTC to match the date selected by the user regardless of server timezone
    const dayOfWeek = date.getUTCDay();

    // Get all availability slots for this pro
    const slots = await this.availabilityRepository.findByProProfileId(proId);

    // Check if there are any slots for the requested day
    return slots.some((slot) => slot.dayOfWeek === dayOfWeek);
  }

  /**
   * Check if a pro has availability slots that include a specific time
   * @param proId - The pro profile ID
   * @param time - The requested time in "HH:MM" format
   * @returns true if the pro has any availability slot that includes that time
   */
  async isProAvailableAtTime(proId: string, time: string): Promise<boolean> {
    // Get all availability slots for this pro
    const slots = await this.availabilityRepository.findByProProfileId(proId);

    // Check if the requested time falls within any slot's time range
    // Time format is "HH:MM" (e.g., "09:00", "17:00")
    return slots.some((slot) => {
      // Compare times as strings (works because "HH:MM" format is lexicographically sortable)
      return time >= slot.startTime && time <= slot.endTime;
    });
  }

  /**
   * Parse time window string into start and end times
   * @param timeWindow - Time window in format "HH:MM-HH:MM" (e.g., "09:00-12:00")
   * @returns Object with startTime and endTime
   */
  private parseTimeWindow(timeWindow: string): {
    startTime: string;
    endTime: string;
  } {
    const [startTime, endTime] = timeWindow.split("-");
    if (!startTime || !endTime) {
      throw new Error(
        `Invalid time window format: ${timeWindow}. Expected format: "HH:MM-HH:MM"`
      );
    }
    return { startTime: startTime.trim(), endTime: endTime.trim() };
  }

  /**
   * Check if two time ranges overlap
   * @param slotStart - Slot start time in "HH:MM" format
   * @param slotEnd - Slot end time in "HH:MM" format
   * @param windowStart - Window start time in "HH:MM" format
   * @param windowEnd - Window end time in "HH:MM" format
   * @returns true if the ranges overlap
   */
  private timeRangesOverlap(
    slotStart: string,
    slotEnd: string,
    windowStart: string,
    windowEnd: string
  ): boolean {
    // Two ranges overlap if: slotStart < windowEnd AND slotEnd > windowStart
    return slotStart < windowEnd && slotEnd > windowStart;
  }

  /**
   * Check if a pro is available in a specific time window on a specific day
   * @param proId - The pro profile ID
   * @param date - The requested date
   * @param timeWindow - Time window in format "HH:MM-HH:MM" (e.g., "09:00-12:00")
   * @returns true if the pro has availability slots that overlap with the time window on that day
   */
  async isProAvailableInTimeWindow(
    proId: string,
    date: Date,
    timeWindow: string
  ): Promise<boolean> {
    // Get day of week in UTC (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Use UTC to match the date selected by the user regardless of server timezone
    const dayOfWeek = date.getUTCDay();

    // Parse time window
    const { startTime: windowStart, endTime: windowEnd } =
      this.parseTimeWindow(timeWindow);

    // Get all availability slots for this pro
    const slots = await this.availabilityRepository.findByProProfileId(proId);

    // Filter slots for the requested day
    const daySlots = slots.filter((slot) => slot.dayOfWeek === dayOfWeek);

    if (daySlots.length === 0) {
      return false;
    }

    // Check if any slot overlaps with the time window
    return daySlots.some((slot) =>
      this.timeRangesOverlap(
        slot.startTime,
        slot.endTime,
        windowStart,
        windowEnd
      )
    );
  }

  /**
   * Check if a pro has availability slots that overlap with a time window (any day)
   * @param proId - The pro profile ID
   * @param timeWindow - Time window in format "HH:MM-HH:MM" (e.g., "09:00-12:00")
   * @returns true if the pro has any availability slot that overlaps with the time window
   */
  async isProAvailableInTimeWindowOnly(
    proId: string,
    timeWindow: string
  ): Promise<boolean> {
    // Parse time window
    const { startTime: windowStart, endTime: windowEnd } =
      this.parseTimeWindow(timeWindow);

    // Get all availability slots for this pro
    const slots = await this.availabilityRepository.findByProProfileId(proId);

    // Check if any slot overlaps with the time window
    return slots.some((slot) =>
      this.timeRangesOverlap(
        slot.startTime,
        slot.endTime,
        windowStart,
        windowEnd
      )
    );
  }

  /**
   * Get availability slots for a pro
   */
  async getAvailabilitySlots(proId: string): Promise<AvailabilitySlot[]> {
    const slots = await this.availabilityRepository.findByProProfileId(proId);
    return slots.map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    }));
  }

  /**
   * Update availability slots for a pro
   * Business rules:
   * - Pro must exist (checked by caller)
   * - Replaces all existing slots with new ones
   */
  async updateAvailabilitySlots(
    proId: string,
    input: UpdateAvailabilitySlotsInput
  ): Promise<AvailabilitySlot[]> {
    // Delete all existing slots
    await this.availabilityRepository.deleteByProProfileId(proId);

    // Create new slots
    const createdSlots = await Promise.all(
      input.slots.map((slot) =>
        this.availabilityRepository.create({
          proProfileId: proId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      )
    );

    return createdSlots.map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    }));
  }

  /**
   * Set default availability slots for a pro
   * Creates default Monday-Friday 9:00-17:00 slots
   * Business rules:
   * - Deletes existing slots before creating new ones
   */
  async setDefaultAvailability(proId: string): Promise<void> {
    // Delete existing slots to avoid duplicates
    await this.availabilityRepository.deleteByProProfileId(proId);

    // Create slots for Monday (1) through Friday (5)
    const defaultSlots = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, // Monday
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }, // Tuesday
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" }, // Wednesday
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" }, // Thursday
      { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" }, // Friday
    ];

    for (const slot of defaultSlots) {
      await this.availabilityRepository.create({
        proProfileId: proId,
        ...slot,
      });
    }
  }

  /**
   * Clear all availability slots for a pro
   */
  async clearAvailability(proId: string): Promise<void> {
    await this.availabilityRepository.deleteByProProfileId(proId);
  }

  /**
   * Check if a pro has any availability slots
   * Used to compute isAvailable flag
   */
  async hasAvailabilitySlots(proId: string): Promise<boolean> {
    const slots = await this.availabilityRepository.findByProProfileId(proId);
    return slots.length > 0;
  }
}
