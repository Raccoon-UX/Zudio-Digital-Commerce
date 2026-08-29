import { NextRequest } from "next/server";
import { getProductAvailabilityByStore } from "@/modules/stores/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId") || undefined;
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    if (!productId) {
      return apiError("INVALID_REQUEST", "Product ID is required.", 400);
    }

    const userLat = latStr ? parseFloat(latStr) : undefined;
    const userLng = lngStr ? parseFloat(lngStr) : undefined;

    const availability = await getProductAvailabilityByStore(
      productId,
      variantId,
      userLat,
      userLng
    );

    return apiSuccess(availability);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Store availability API error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve store stock availability.", 500);
  }
}
