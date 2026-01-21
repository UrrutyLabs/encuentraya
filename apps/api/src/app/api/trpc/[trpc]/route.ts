import "reflect-metadata";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPCError } from "@trpc/server";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/infrastructure/trpc/context";
import { createChildLogger } from "@/server/infrastructure/utils/logger";
import { getTrpcCorsHeaders } from "@/server/infrastructure/cors";

const handler = async (req: Request) => {
  const context = await createContext(req);
  const requestLogger = createChildLogger({
    requestId: context.requestId,
    userId: context.actor?.id,
    userRole: context.actor?.role,
  });

  // Get CORS headers based on request origin
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = getTrpcCorsHeaders(requestOrigin);

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => context,
    onError: ({ error, path, type, input }) => {
      const errorContext: Record<string, unknown> = {
        path,
        type,
        requestId: context.requestId,
        userId: context.actor?.id,
        userRole: context.actor?.role,
      };

      // Add input data for debugging (be careful with sensitive data)
      if (input && process.env.NODE_ENV === "development") {
        errorContext.input = input;
      }

      // Handle different error types
      if (error instanceof TRPCError) {
        // tRPC errors (expected errors)
        const logData = {
          ...errorContext,
          code: error.code,
          message: error.message,
          cause: error.cause,
        };

        // Log at appropriate level based on error code
        if (error.code === "INTERNAL_SERVER_ERROR") {
          requestLogger.error(logData, "tRPC Internal Server Error");
        } else if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
          requestLogger.warn(logData, "tRPC Authorization Error");
        } else {
          requestLogger.info(logData, "tRPC Error");
        }
      } else {
        // Unexpected errors (should be rare)
        const unknownError = error as unknown;
        requestLogger.error(
          {
            ...errorContext,
            error: {
              name: unknownError instanceof Error ? unknownError.name : "Unknown",
              message: unknownError instanceof Error ? unknownError.message : String(unknownError),
              stack: unknownError instanceof Error ? unknownError.stack : undefined,
            },
          },
          "Unexpected tRPC Error"
        );
      }
    },
  });

  // Add CORS headers and request ID to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set("x-request-id", context.requestId);

  return response;
};

export async function OPTIONS(req: Request) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = getTrpcCorsHeaders(requestOrigin);
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export { handler as GET, handler as POST };
