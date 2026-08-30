import { prisma } from "../lib/prisma/client";
import { importDataset } from "../scripts/import-datasets";

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
