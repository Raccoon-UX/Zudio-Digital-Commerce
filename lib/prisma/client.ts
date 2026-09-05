import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Priority: DATABASE_URL (Supabase Transaction Pooler) -> Vercel pooled POSTGRES_PRISMA_URL -> POSTGRES_URL -> PRISMA_DATABASE_URL
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.PRISMA_DATABASE_URL;

// Ensure process.env.DATABASE_URL is populated for Prisma schema validation
if (dbUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl;
}

function getOptimizedDbUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.includes("connection_limit=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=5&pool_timeout=20`;
}

const optimizedUrl = getOptimizedDbUrl(dbUrl);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: optimizedUrl ? { db: { url: optimizedUrl } } : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

globalForPrisma.prisma = prisma;

export default prisma;
