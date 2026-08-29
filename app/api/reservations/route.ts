import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { createReservation, getUserReservations } from "@/modules/reservations/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Please sign in to view your reservations.", 401);
    }

    const reservations = await getUserReservations(user.id);
    return apiSuccess(reservations);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Fetch reservations error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve reservations.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "reservation_create", 10, 60 * 1000);
    const user = await getCurrentUser();
    const body = await request.json();
    const { storeId, variantId, quantity, guestName, guestEmail, guestPhone, notes } = body;

    if (!storeId || !variantId) {
      return apiError("INVALID_REQUEST", "Store ID and Variant ID are required.", 400);
    }

    const reservation = await createReservation(
      {
        storeId,
        variantId,
        quantity: quantity || 1,
        guestName,
        guestEmail,
        guestPhone,
        notes,
      },
      user?.id
    );

    return apiSuccess(reservation, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Create reservation error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to create in-store reservation.", 500);
  }
}
