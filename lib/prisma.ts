import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 10,
    connectionTimeoutMillis: 30000,
    query_timeout: 30000,
    idleTimeoutMillis: 60000,
    allowExitOnIdle: false,
  });
  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

// Transient error codes worth retrying
const RETRYABLE_ERRORS = [
  "Connection terminated due to connection timeout",
  "Connection terminated unexpectedly",
  "connect ETIMEDOUT",
  "connect ECONNREFUSED",
  "socket hang up",
  "Operation has timed out",
  "P1001", // Prisma: Can't reach database server
  "P1008", // Prisma: Operation timed out
  "P1017", // Prisma: Server closed the connection
];

function isRetryable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return RETRYABLE_ERRORS.some((e) => msg.includes(e));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === retries) throw error;
      await new Promise((res) => setTimeout(res, delayMs * attempt));
    }
  }
  throw lastError;
}
