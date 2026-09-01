const { execSync } = require("child_process");

// Check available database connection strings provided by Vercel environment
const dbUrl =
  process.env.PRISMA_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

const isRemoteUrl =
  dbUrl &&
  typeof dbUrl === "string" &&
  dbUrl.trim() !== "[SENSITIVE]" &&
  !dbUrl.includes("localhost:5432") &&
  (dbUrl.startsWith("postgresql://") ||
    dbUrl.startsWith("postgres://") ||
    dbUrl.startsWith("prisma+postgres://"));

if (isRemoteUrl) {
  process.env.DATABASE_URL = dbUrl;
  console.log("⚡ Vercel Production Database detected. Synchronizing Prisma schema...");
  try {
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      env: process.env,
    });
    console.log("✅ Database schema synchronized successfully.");
  } catch (error) {
    console.error("⚠️ Prisma schema synchronization error:", error.message);
  }

  console.log("🌱 Ingesting Zudio CSV dataset into PostgreSQL...");
  try {
    execSync("npx tsx scripts/import-datasets.ts", {
      stdio: "inherit",
      env: process.env,
    });
    console.log("✅ Dataset ingestion complete.");
  } catch (error) {
    console.error("⚠️ Dataset ingestion error:", error.message);
  }
} else {
  console.log("ℹ️ Skipping build-time database synchronization (no remote database URL in current environment).");
}
