import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getAdminOrders, requireAdminUser } from "@/modules/admin/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAdminUser(user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const storeId = searchParams.get("storeId") || undefined;
    const search = searchParams.get("search") || undefined;

    const orders = await getAdminOrders({ status, storeId, search });
    return apiSuccess(orders);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Admin orders fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve orders.", 500);
  }
}
