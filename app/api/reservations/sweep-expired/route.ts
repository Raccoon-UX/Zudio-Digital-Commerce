import { NextRequest } from "next/server";
import { sweepExpiredReservations } from "@/modules/reservations/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const result = await sweepExpiredReservations();
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Expiration sweep error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to run expiration sweep.", 500);
  }
}
