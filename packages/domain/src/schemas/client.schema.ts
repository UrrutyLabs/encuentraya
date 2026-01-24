import { z } from "zod";
import { categorySchema } from "../enums";

/**
 * Time window enum for search filters
 * 3-hour windows from 9:00 to 18:00
 */
export const timeWindowSchema = z.enum([
  "09:00-12:00", // Morning window
  "12:00-15:00", // Afternoon window
  "15:00-18:00", // Evening window
]);

export type TimeWindow = z.infer<typeof timeWindowSchema>;

/**
 * Client search pros input schema
 */
export const clientSearchProsInputSchema = z.object({
  category: categorySchema.optional(),
  date: z.date().optional(),
  timeWindow: timeWindowSchema.optional(), // 3-hour time window
});

export type ClientSearchProsInput = z.infer<typeof clientSearchProsInputSchema>;

/**
 * Preferred contact method enum
 */
export const preferredContactMethodSchema = z.enum([
  "EMAIL",
  "WHATSAPP",
  "PHONE",
]);

export type PreferredContactMethod = z.infer<
  typeof preferredContactMethodSchema
>;

/**
 * Client signup input schema
 */
export const clientSignupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional().nullable(),
  lastName: z.string().min(1).optional().nullable(),
  phone: z.string().optional().nullable(),
});

export type ClientSignupInput = z.infer<typeof clientSignupInputSchema>;

/**
 * Client profile update input schema
 */
export const clientProfileUpdateInputSchema = z.object({
  phone: z.string().optional().nullable(),
  preferredContactMethod: preferredContactMethodSchema.optional().nullable(),
});

export type ClientProfileUpdateInput = z.infer<
  typeof clientProfileUpdateInputSchema
>;

/**
 * Change password input schema
 */
export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

/**
 * Delete account input schema
 */
export const deleteAccountInputSchema = z.object({
  password: z.string().min(1, "Password is required for account deletion"),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountInputSchema>;

/**
 * Request password reset input schema
 * Used when user forgets their password
 */
export const requestPasswordResetInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetInputSchema
>;

/**
 * Reset password input schema
 * Used to reset password with token from email
 */
export const resetPasswordInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

/**
 * Reset password with OTP input schema
 * Used for mobile apps that don't support deep links
 */
export const resetPasswordWithOtpInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .min(6, "OTP code must be at least 6 characters")
    .max(8, "OTP code must be at most 8 characters"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ResetPasswordWithOtpInput = z.infer<
  typeof resetPasswordWithOtpInputSchema
>;
