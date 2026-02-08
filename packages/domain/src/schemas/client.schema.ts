import { z } from "zod";

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
  categoryId: z.string().optional(), // FK to Category table
  subcategory: z.string().optional(), // Subcategory slug
  q: z.string().min(1).optional(), // Free-text query; resolved server-side to category/subcategory
  date: z.date().optional(),
  timeWindow: timeWindowSchema.optional(), // 3-hour time window
});

export type ClientSearchProsInput = z.infer<typeof clientSearchProsInputSchema>;

/**
 * Typeahead: search categories and subcategories by text (FTS + trigram)
 */
export const searchCategoriesAndSubcategoriesInputSchema = z.object({
  q: z.string().min(1),
  limit: z.number().int().min(1).max(20).optional().default(10),
});

export type SearchCategoriesAndSubcategoriesInput = z.infer<
  typeof searchCategoriesAndSubcategoriesInputSchema
>;

/**
 * Category suggestion item for typeahead
 */
export const categorySuggestionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export type CategorySuggestion = z.infer<typeof categorySuggestionSchema>;

/**
 * Subcategory suggestion item for typeahead (includes category for display and URL)
 */
export const subcategorySuggestionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  categorySlug: z.string(),
});

export type SubcategorySuggestion = z.infer<typeof subcategorySuggestionSchema>;

/**
 * Typeahead response: categories and subcategories matching the query
 */
export const searchCategoriesAndSubcategoriesOutputSchema = z.object({
  categories: z.array(categorySuggestionSchema),
  subcategories: z.array(subcategorySuggestionSchema),
});

export type SearchCategoriesAndSubcategoriesOutput = z.infer<
  typeof searchCategoriesAndSubcategoriesOutputSchema
>;

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
  /** Storage path from client_avatar presigned upload (e.g. "client/{userId}/{file}.jpg"). Server validates prefix. */
  avatarUrl: z.string().min(1).optional().nullable(),
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
