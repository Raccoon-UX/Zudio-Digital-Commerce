import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { updateAdminUserRole, requireAdminUser } from "@/modules/admin/service";
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
    const { role, storeId } = body;

    if (!role || (role !== "CUSTOMER" && role !== "STORE_STAFF" && role !== "ADMIN")) {
      return apiError("INVALID_REQUEST", "Valid role ('CUSTOMER', 'STORE_STAFF', 'ADMIN') is required.", 400);
    }

    const updated = await updateAdminUserRole(
      params.id,
      role,
      storeId,
      user!
    );

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Admin role update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to update user role.", 500);
  }
}
