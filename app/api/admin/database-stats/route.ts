import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      categoryCount,
      storeCount,
      productCount,
      variantCount,
      imageCount,
      inventoryCount,
      userCount,
      sampleStores,
      sampleProducts,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.store.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.productImage.count(),
      prisma.inventory.count(),
      prisma.user.count(),
      prisma.store.findMany({
        take: 5,
        select: { id: true, name: true, city: true, state: true, pincode: true, openingHours: true },
      }),
      prisma.product.findMany({
        take: 5,
        select: { id: true, name: true, slug: true, category: { select: { name: true } } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      database: "PostgreSQL",
      timestamp: new Date().toISOString(),
      counts: {
        categories: categoryCount,
        stores: storeCount,
        products: productCount,
        productVariants: variantCount,
        productImages: imageCount,
        inventoryRecords: inventoryCount,
        users: userCount,
      },
      samples: {
        stores: sampleStores,
        products: sampleProducts,
      },
    });
  } catch (error: any) {
    console.error("Database stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve database stats",
      },
      { status: 500 }
    );
  }
}
