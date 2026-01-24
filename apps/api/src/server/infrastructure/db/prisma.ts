import { PrismaClient } from "../../../../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { initializeEnvValidation } from "../env-validation";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

initializeEnvValidation();

/**
 * Create and configure database connection pool
 */
function createDatabasePool(): Pool {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Connection pool configuration
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection cannot be established
  });

  // Handle pool errors
  pool.on("error", (err) => {
    console.error("Unexpected error on idle database client", err);
    // Don't exit the process, but log the error for monitoring
  });

  // Handle connection errors
  pool.on("connect", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Database connection established");
    }
  });

  return pool;
}

// Initialize pool with validation
let pool: Pool;
try {
  pool = createDatabasePool();
} catch (error) {
  console.error("❌ Failed to initialize database connection pool:", error);
  throw error;
}

const adapter = new PrismaPg(pool);

/**
 * Create Prisma client instance with adapter
 */
function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  } catch (error) {
    console.error("❌ Failed to create Prisma client:", error);
    throw error;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Re-export Prisma types for convenience
export { $Enums, Prisma } from "../../../../prisma/generated/prisma/client";
