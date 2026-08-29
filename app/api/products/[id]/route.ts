import { NextRequest } from "next/server";
import { getProductByIdOrSlug } from "@/modules/products/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductByIdOrSlug(params.id);

    if (!product) {
      return apiError("PRODUCT_NOT_FOUND", "Product not found.", 404);
    }

    return apiSuccess(product);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve product", 500);
  }
}
