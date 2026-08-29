import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getAdminOrderDetail, requireAdminUser } from "@/modules/admin/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    requireAdminUser(user);

    const order = await getAdminOrderDetail(params.id);
    return apiSuccess(order);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Admin order detail fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve order detail.", 500);
  }
}
