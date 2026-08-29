import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { WishlistDTO } from "./types";
import { ProductCardDTO } from "@/modules/products/types";

export async function getOrCreateWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
    });
  }

  return wishlist;
}

export async function getUserWishlist(userId: string): Promise<WishlistDTO> {
  try {
    const wishlist = await getOrCreateWishlist(userId);

    const items = await prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        product: {
          include: {
            category: { select: { name: true, slug: true } },
            images: { orderBy: { sortOrder: "asc" } },
            variants: {
              where: { isActive: true },
              include: { size: true, color: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedItems = items.map((item) => {
      const p = item.product;
      const prices = p.variants.map((v) => Number(v.price));
      const minP = prices.length > 0 ? Math.min(...prices) : 0;
      const comparePrice = p.variants[0]?.compareAtPrice
        ? Number(p.variants[0].compareAtPrice)
        : null;

      const sizeSet = new Set<string>();
      const colorMap = new Map<string, string>();
      p.variants.forEach((v) => {
        if (v.size?.name) sizeSet.add(v.size.name);
        if (v.color?.name && v.color?.hexCode) colorMap.set(v.color.name, v.color.hexCode);
      });

      const primaryImg = p.images.find((img) => img.isPrimary) || p.images[0];
      const secondaryImg = p.images.find((img) => !img.isPrimary && img.id !== primaryImg?.id) || null;

      const productCard: ProductCardDTO = {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryName: p.category.name,
        categorySlug: p.category.slug,
        price: minP,
        compareAtPrice: comparePrice,
        imageUrl: primaryImg?.url || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        secondaryImageUrl: secondaryImg?.url || null,
        isNewArrival: p.isNewArrival,
        isFeatured: p.isFeatured,
        availableSizes: Array.from(sizeSet),
        availableColors: Array.from(colorMap.entries()).map(([name, hexCode]) => ({ name, hexCode })),
      };

      return {
        id: item.id,
        productId: item.productId,
        product: productCard,
        createdAt: item.createdAt.toISOString(),
      };
    });

    return {
      id: wishlist.id,
      userId,
      items: mappedItems,
      count: mappedItems.length,
    };
  } catch (error) {
    console.error("Error fetching user wishlist:", error);
    throw new AppError("Failed to fetch wishlist.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function toggleWishlistProduct(userId: string, productId: string) {
  try {
    const wishlist = await getOrCreateWishlist(userId);

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    let wishlisted = false;
    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      wishlisted = false;
    } else {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
      wishlisted = true;
    }

    const count = await prisma.wishlistItem.count({
      where: { wishlistId: wishlist.id },
    });

    return { wishlisted, count };
  } catch (error) {
    console.error("Error toggling wishlist item:", error);
    throw new AppError("Failed to update wishlist.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function removeFromWishlist(userId: string, productId: string) {
  try {
    const wishlist = await getOrCreateWishlist(userId);

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw new AppError("Failed to remove item from wishlist.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}
