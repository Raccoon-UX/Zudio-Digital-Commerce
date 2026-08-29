import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { updateReservationStatusByStaff } from "@/modules/reservations/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "STORE_STAFF" && user.role !== "ADMIN")) {
      return apiError("FORBIDDEN", "Staff credentials required to update reservation status.", 403);
    }

    const body = await request.json();
    const { status } = body;

    if (status !== "READY_FOR_PICKUP" && status !== "COLLECTED" && status !== "CANCELLED") {
      return apiError("INVALID_REQUEST", "Invalid target status for staff update.", 400);
    }

    const updated = await updateReservationStatusByStaff(
      params.id,
      status,
      user
    );

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Staff reservation update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to update reservation status.", 500);
  }
}
