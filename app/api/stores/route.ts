import { NextRequest } from "next/server";
import { getStores, getStoreCities } from "@/modules/stores/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const city = searchParams.get("city") || undefined;
    const state = searchParams.get("state") || undefined;
    const pincode = searchParams.get("pincode") || undefined;
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    const userLat = latStr ? parseFloat(latStr) : undefined;
    const userLng = lngStr ? parseFloat(lngStr) : undefined;

    const [stores, cities] = await Promise.all([
      getStores({ search, city, state, pincode, userLat, userLng }),
      getStoreCities(),
    ]);

    return apiSuccess(
      { stores, cities },
      200,
      undefined,
      {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Store list API error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve stores.", 500);
  }
}
