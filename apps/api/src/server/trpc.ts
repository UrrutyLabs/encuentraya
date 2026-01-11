import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Actor } from "./auth/roles";
import { Role } from "@repo/domain";

/**
 * Context type for tRPC
 */
export interface Context {
  actor: Actor | null;
  requestId: string;
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/**
 * Middleware to enforce authentication
 * Throws UNAUTHORIZED if actor is null
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.actor) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      actor: ctx.actor, // TypeScript now knows actor is non-null
    },
  });
});

/**
 * Middleware to enforce pro role
 * Throws FORBIDDEN if actor is not a pro
 */
const enforceProRole = t.middleware(({ ctx, next }) => {
  if (!ctx.actor) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  if (ctx.actor.role !== Role.PRO) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Pro role required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      actor: ctx.actor,
    },
  });
});

/**
 * Middleware to enforce admin role
 * Throws FORBIDDEN if actor is not an admin
 */
const enforceAdminRole = t.middleware(({ ctx, next }) => {
  if (!ctx.actor) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  if (ctx.actor.role !== Role.ADMIN) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin role required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      actor: ctx.actor,
    },
  });
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);
export const proProcedure = t.procedure.use(enforceProRole);
export const adminProcedure = t.procedure.use(enforceAdminRole);
