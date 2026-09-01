import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function loadEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      result[key] = val;
    }
  }
  return result;
}

const envLocal = loadEnvFile(path.join(process.cwd(), ".env.local"));
const envDefault = loadEnvFile(path.join(process.cwd(), ".env"));

function isValidPostgresUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed === "[SENSITIVE]" || trimmed.includes("localhost:5432")) return false;
  return (
    trimmed.startsWith("postgresql://") ||
    trimmed.startsWith("postgres://") ||
    trimmed.startsWith("prisma+postgres://")
  );
}

// Check candidates in order of preference for genuine Postgres URLs
const candidates = [
  envLocal.POSTGRES_PRISMA_URL,
  envLocal.POSTGRES_URL,
  envLocal.DATABASE_URL,
  envLocal.PRISMA_DATABASE_URL,
  envDefault.POSTGRES_PRISMA_URL,
  envDefault.POSTGRES_URL,
  envDefault.DATABASE_URL,
  envDefault.PRISMA_DATABASE_URL,
];

const validUrl = candidates.find(isValidPostgresUrl);

if (validUrl) {
  process.env.DATABASE_URL = validUrl;
  console.log("🔒 Successfully resolved genuine remote PostgreSQL connection string from environment.");
  try {
    execSync("npx prisma db push", { stdio: "inherit", env: process.env });
  } catch (error) {
    process.exit(1);
  }
} else {
  console.error("❌ No valid remote PostgreSQL connection string found.");
  console.error("Please ensure your PostgreSQL connection URL is pasted into .env.local or .env (starts with postgresql://).");
  process.exit(1);
}
