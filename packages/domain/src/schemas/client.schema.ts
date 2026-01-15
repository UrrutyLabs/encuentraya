import { z } from "zod";
import { categorySchema } from "../enums";

/**
 * Client search pros input schema
 */
export const clientSearchProsInputSchema = z.object({
  category: categorySchema.optional(),
  date: z.date().optional(),
  time: z.string().optional(), // "HH:MM" format
});

export type ClientSearchProsInput = z.infer<typeof clientSearchProsInputSchema>;

/**
 * Preferred contact method enum
 */
export const preferredContactMethodSchema = z.enum(["EMAIL", "WHATSAPP", "PHONE"]);

export type PreferredContactMethod = z.infer<typeof preferredContactMethodSchema>;

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

export type ClientProfileUpdateInput = z.infer<typeof clientProfileUpdateInputSchema>;

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
