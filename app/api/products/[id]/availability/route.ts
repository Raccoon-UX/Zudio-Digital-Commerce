import { NextRequest } from "next/server";
import { getProductStoreAvailability } from "@/modules/stores/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const variantId = searchParams.get("variantId") || undefined;

    const availability = await getProductStoreAvailability(params.id, variantId);

    return apiSuccess(availability);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError(
      "INTERNAL_SERVER_ERROR",
      "Failed to check store stock availability",
      500
    );
  }
}
