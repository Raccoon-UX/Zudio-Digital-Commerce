import { NextRequest } from "next/server";
import { getProducts } from "@/modules/products/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("q") || searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sizesParam = searchParams.get("sizes") || searchParams.get("size");
    const colorsParam = searchParams.get("colors") || searchParams.get("color");
    const sortParam = searchParams.get("sort") as "price_asc" | "price_desc" | "newest" | "featured" | null;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;
    const sizes = sizesParam ? sizesParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const colors = colorsParam ? colorsParam.split(",").map((c) => c.trim()).filter(Boolean) : undefined;
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 12;

    const result = await getProducts({
      search,
      category,
      minPrice,
      maxPrice,
      sizes,
      colors,
      sort: sortParam || "featured",
      page,
      limit,
    });

    return apiSuccess(result.products, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve products", 500);
  }
}
