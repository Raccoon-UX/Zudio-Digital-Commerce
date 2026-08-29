import { NextRequest } from "next/server";
import { getStoreBySlug } from "@/modules/stores/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = await getStoreBySlug(params.id);

    if (!store) {
      return apiError("NOT_FOUND", "Store location not found.", 404);
    }

    return apiSuccess(store);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Store detail API error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve store details.", 500);
  }
}
