import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { CategoryDTO } from "./types";
import { memoryCache } from "@/lib/cache";

export async function getCategories(): Promise<CategoryDTO[]> {
  const cacheKey = "categories:all";
  const cached = memoryCache.get<CategoryDTO[]>(cacheKey);
  if (cached) return cached;

  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null, // Top-level categories
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const mapped: CategoryDTO[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      parentId: cat.parentId,
      sortOrder: cat.sortOrder,
      productCount: cat._count.products,
      children: cat.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        imageUrl: child.imageUrl,
        parentId: child.parentId,
        sortOrder: child.sortOrder,
        productCount: child._count.products,
      })),
    }));

    memoryCache.set(cacheKey, mapped, 300); // 5 min TTL
    return mapped;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new AppError(
      "Failed to retrieve categories from database. Please verify database connection.",
      "INTERNAL_SERVER_ERROR",
      500,
      error
    );
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDTO | null> {
  const cleanSlug = slug.trim().toLowerCase();
  const cacheKey = `category:${cleanSlug}`;
  const cached = memoryCache.get<CategoryDTO>(cacheKey);
  if (cached) return cached;

  try {
    const category = await prisma.category.findUnique({
      where: { slug: cleanSlug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { products: true } },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) return null;

    const mapped: CategoryDTO = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      productCount: category._count.products,
      children: category.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        imageUrl: child.imageUrl,
        parentId: child.parentId,
        sortOrder: child.sortOrder,
        productCount: child._count.products,
      })),
    };

    memoryCache.set(cacheKey, mapped, 300);
    return mapped;
  } catch (error) {
    console.error(`Error fetching category with slug ${slug}:`, error);
    throw new AppError(
      `Failed to retrieve category ${slug} from database.`,
      "INTERNAL_SERVER_ERROR",
      500,
      error
    );
  }
}

export function invalidateCategoryCache(): void {
  memoryCache.deletePattern("categories:");
  memoryCache.deletePattern("category:");
}
