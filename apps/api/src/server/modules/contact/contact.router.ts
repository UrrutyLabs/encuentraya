import { router, publicProcedure } from "@infra/trpc";
import { TRPCError } from "@trpc/server";
import { container, TOKENS } from "@/server/container";
import type { ContactService } from "./contact.service";
import { contactFormInputSchema } from "@repo/domain";
import { contactRateLimiter } from "@infra/rate-limiter";

// Resolve service from container
const contactService = container.resolve<ContactService>(TOKENS.ContactService);

export const contactRouter = router({
  /**
   * Submit a contact form
   * Public endpoint with rate limiting (5 requests per 15 minutes per email)
   */
  submit: publicProcedure
    .input(contactFormInputSchema)
    .mutation(async ({ input }) => {
      // Rate limiting: Check by email
      const emailKey = `email:${input.email.toLowerCase()}`;

      // Check rate limit by email
      const emailResult = await contactRateLimiter.limit(emailKey);
      if (!emailResult.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many requests from this email. Please try again later.`,
          cause: {
            retryAfter: Math.ceil((emailResult.reset - Date.now()) / 1000),
          },
        });
      }

      try {
        const result = await contactService.submitContactForm(input);

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send contact form. Please try again later.",
          });
        }

        return {
          success: true,
          message:
            "Your message has been sent successfully. We'll get back to you soon!",
        };
      } catch (error) {
        // Re-throw TRPCErrors as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Log unexpected errors
        console.error("Error submitting contact form:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred. Please try again later.",
        });
      }
    }),
});
