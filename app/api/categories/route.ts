import { getCategories } from "@/modules/categories/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getCategories();
    return apiSuccess(categories);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve categories", 500);
  }
}
