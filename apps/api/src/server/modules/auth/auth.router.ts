import { router, protectedProcedure, publicProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { AuthService } from "./auth.service";
import {
  clientSignupInputSchema,
  proSignupInputSchema,
  changePasswordInputSchema,
  deleteAccountInputSchema,
} from "@repo/domain";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const authService = container.resolve<AuthService>(TOKENS.AuthService);

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.actor.id,
      role: ctx.actor.role,
    };
  }),

  signup: publicProcedure
    .input(clientSignupInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.signupClient(input);
      } catch (error) {
        // Map common errors to appropriate tRPC error codes
        if (error instanceof Error) {
          // Supabase errors often indicate bad input
          if (
            error.message.includes("already registered") ||
            error.message.includes("already exists")
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email already registered",
            });
          }

          if (error.message.includes("password")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create user account",
        });
      }
    }),

  proSignup: publicProcedure
    .input(proSignupInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.signupPro(input);
      } catch (error) {
        // Map common errors to appropriate tRPC error codes
        if (error instanceof Error) {
          // Supabase errors often indicate bad input
          if (
            error.message.includes("already registered") ||
            error.message.includes("already exists")
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email already registered",
            });
          }

          if (error.message.includes("password")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create user account",
        });
      }
    }),

  changePassword: protectedProcedure
    .input(changePasswordInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await authService.changePassword(
          ctx.actor.id,
          input.currentPassword,
          input.newPassword
        );
        return { success: true };
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes("incorrect") ||
            error.message.includes("password")
          ) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: error.message,
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to change password",
        });
      }
    }),

  deleteAccount: protectedProcedure
    .input(deleteAccountInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await authService.deleteAccount(ctx.actor.id, input.password);
        return { success: true };
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes("incorrect") ||
            error.message.includes("password")
          ) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: error.message,
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete account",
        });
      }
    }),
});
