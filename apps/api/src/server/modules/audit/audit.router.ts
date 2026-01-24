import { z } from "zod";
import { router, adminProcedure } from "@infra/trpc";
import { container, TOKENS } from "../../container";
import { AuditService } from "./audit.service";
import { AuditEventType } from "./audit.repo";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const auditService = container.resolve<AuditService>(TOKENS.AuditService);

export const auditRouter = router({
  /**
   * Admin: Get audit logs for a specific resource
   */
  getResourceLogs: adminProcedure
    .input(
      z.object({
        resourceType: z.string(),
        resourceId: z.string(),
        eventTypes: z.array(z.nativeEnum(AuditEventType)).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = await auditService.getResourceLogs(
          input.resourceType,
          input.resourceId
        );

        // Filter by event types if provided
        if (input.eventTypes && input.eventTypes.length > 0) {
          return logs.filter((log) =>
            input.eventTypes!.includes(log.eventType)
          );
        }

        return logs;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get audit logs",
        });
      }
    }),
});
