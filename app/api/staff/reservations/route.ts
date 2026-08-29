import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getStoreStaffReservations } from "@/modules/reservations/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "STORE_STAFF" && user.role !== "ADMIN")) {
      return apiError("FORBIDDEN", "Staff credentials required to access portal.", 403);
    }

    const { searchParams } = new URL(request.url);
    const filterStoreId = searchParams.get("storeId") || undefined;
    const statusFilter = searchParams.get("status") || undefined;

    const reservations = await getStoreStaffReservations(
      user,
      filterStoreId,
      statusFilter
    );

    return apiSuccess(reservations);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Staff reservations list error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve store reservations.", 500);
  }
}
