import { NextResponse } from "next/server";
import { importDataset } from "@/scripts/import-datasets";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s timeout for large dataset ingestion

export async function POST() {
  try {
    console.log("🚀 Manual trigger: Starting dataset ingestion via /api/admin/import-dataset...");
    await importDataset();

    const [categories, stores, products, variants, images, inventories, users] = await Promise.all([
      prisma.category.count(),
      prisma.store.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.productImage.count(),
      prisma.inventory.count(),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Dataset imported successfully into PostgreSQL.",
      counts: {
        categories,
        stores,
        products,
        productVariants: variants,
        productImages: images,
        inventoryRecords: inventories,
        users,
      },
    });
  } catch (error: any) {
    console.error("Dataset ingestion API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Dataset import failed",
      },
      { status: 500 }
    );
  }
}
