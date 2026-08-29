import { PrismaClient } from "@prisma/client";
import { importDataset } from "../scripts/import-datasets";

const prisma = new PrismaClient();

async function main() {
  await importDataset();
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
