import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { updateAdminOrderStatus, requireAdminUser } from "@/modules/admin/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    requireAdminUser(user);

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return apiError("INVALID_REQUEST", "Target status is required.", 400);
    }

    const updated = await updateAdminOrderStatus(
      params.id,
      status,
      user!
    );

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Admin order status update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to update order status.", 500);
  }
}
