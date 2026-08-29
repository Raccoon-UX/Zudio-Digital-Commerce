import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import {
  ProductCardDTO,
  ProductDetailDTO,
  ProductQueryParams,
  PaginatedProductsDTO,
} from "./types";
import { Prisma } from "@prisma/client";

export async function getProducts(
  params: ProductQueryParams = {}
): Promise<PaginatedProductsDTO> {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sizes,
    colors,
    sort = "featured",
    page = 1,
    limit = 12,
  } = params;

  try {
    // Build Prisma `where` clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // Keyword Search
    if (search && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ];
    }

    // Category Filter (support parent category or subcategory slug)
    if (category && category !== "all") {
      where.category = {
        OR: [
          { slug: category },
          { parent: { slug: category } },
        ],
      };
    }

    // Variants-based Filters: Price, Size, Color
    const variantFilter: Prisma.ProductVariantWhereInput = {
      isActive: true,
    };

    if (minPrice !== undefined || maxPrice !== undefined) {
      variantFilter.price = {};
      if (minPrice !== undefined) variantFilter.price.gte = minPrice;
      if (maxPrice !== undefined) variantFilter.price.lte = maxPrice;
    }

    if (sizes && sizes.length > 0) {
      variantFilter.size = {
        name: { in: sizes },
      };
    }

    if (colors && colors.length > 0) {
      variantFilter.color = {
        name: { in: colors },
      };
    }

    // If any variant filters applied, attach to product where
    if (
      minPrice !== undefined ||
      maxPrice !== undefined ||
      (sizes && sizes.length > 0) ||
      (colors && colors.length > 0)
    ) {
      where.variants = {
        some: variantFilter,
      };
    }

    // Ordering
    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = {
      createdAt: "desc",
    };

    if (sort === "featured") {
      orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
    } else if (sort === "newest") {
      orderBy = [{ isNewArrival: "desc" }, { createdAt: "desc" }];
    }

    const skip = (page - 1) * limit;

    // Execute count and query in parallel
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          images: {
            orderBy: { sortOrder: "asc" },
          },
          variants: {
            where: { isActive: true },
            include: {
              size: true,
              color: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const mappedProducts: ProductCardDTO[] = products.map((p) => {
      // Find min price across variants
      const prices = p.variants.map((v) => Number(v.price));
      const minP = prices.length > 0 ? Math.min(...prices) : 0;
      const comparePrice = p.variants[0]?.compareAtPrice
        ? Number(p.variants[0].compareAtPrice)
        : null;

      // Unique sizes and colors
      const sizeSet = new Set<string>();
      const colorMap = new Map<string, string>();

      p.variants.forEach((v) => {
        if (v.size?.name) sizeSet.add(v.size.name);
        if (v.color?.name && v.color?.hexCode) {
          colorMap.set(v.color.name, v.color.hexCode);
        }
      });

      const primaryImg = p.images.find((img) => img.isPrimary) || p.images[0];
      const secondaryImg = p.images.find((img) => !img.isPrimary && img.id !== primaryImg?.id) || null;

      return {
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
        availableColors: Array.from(colorMap.entries()).map(([name, hexCode]) => ({
          name,
          hexCode,
        })),
      };
    });

    // Handle price sorting client/array side if requested
    if (sort === "price_asc") {
      mappedProducts.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      mappedProducts.sort((a, b) => b.price - a.price);
    }

    return {
      products: mappedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new AppError(
      "Failed to retrieve products from database. Please verify PostgreSQL connection.",
      "INTERNAL_SERVER_ERROR",
      500,
      error
    );
  }
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<ProductDetailDTO | null> {
  try {
    const isCuid = idOrSlug.startsWith("c") && idOrSlug.length > 20;

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          ...(isCuid ? [{ id: idOrSlug }] : []),
          { slug: idOrSlug },
        ],
        isActive: true,
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          where: { isActive: true },
          include: {
            size: true,
            color: true,
          },
        },
      },
    });

    if (!product) return null;

    const allSizesMap = new Map<string, { id: string; name: string; sortOrder: number }>();
    const allColorsMap = new Map<string, { id: string; name: string; hexCode: string }>();

    const variants = product.variants.map((v) => {
      if (v.size) {
        allSizesMap.set(v.size.id, {
          id: v.size.id,
          name: v.size.name,
          sortOrder: v.size.sortOrder,
        });
      }
      if (v.color) {
        allColorsMap.set(v.color.id, {
          id: v.color.id,
          name: v.color.name,
          hexCode: v.color.hexCode,
        });
      }

      return {
        id: v.id,
        sku: v.sku,
        sizeId: v.sizeId,
        sizeName: v.size.name,
        colorId: v.colorId,
        colorName: v.color.name,
        colorHex: v.color.hexCode,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        isActive: v.isActive,
      };
    });

    const sortedSizes = Array.from(allSizesMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
    const colorsList = Array.from(allColorsMap.values());

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      details: product.details,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      variants,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })),
      allSizes: sortedSizes,
      allColors: colorsList,
    };
  } catch (error) {
    console.error(`Error fetching product ${idOrSlug}:`, error);
    throw new AppError(
      `Failed to retrieve product details from database.`,
      "INTERNAL_SERVER_ERROR",
      500,
      error
    );
  }
}

export async function getFeaturedProducts(limit = 4): Promise<ProductCardDTO[]> {
  const result = await getProducts({ sort: "featured", limit });
  return result.products;
}

export async function getNewArrivals(limit = 4): Promise<ProductCardDTO[]> {
  const result = await getProducts({ sort: "newest", limit });
  return result.products;
}
