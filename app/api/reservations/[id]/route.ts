import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getReservationByIdOrCode, cancelReservation } from "@/modules/reservations/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guestToken = searchParams.get("guestToken") || undefined;

    const staffUser = user && (user.role === "ADMIN" || user.role === "STORE_STAFF") ? user : null;

    const reservation = await getReservationByIdOrCode(
      params.id,
      user?.id,
      guestToken,
      staffUser
    );

    if (!reservation) {
      return apiError("NOT_FOUND", "Reservation not found.", 404);
    }

    return apiSuccess(reservation);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Fetch reservation detail error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve reservation details.", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const guestToken = searchParams.get("guestToken") || undefined;

    const cancelled = await cancelReservation(
      params.id,
      user,
      guestToken
    );

    return apiSuccess(cancelled);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Cancel reservation error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to cancel reservation.", 500);
  }
}
