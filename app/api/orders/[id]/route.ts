import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getOrderByIdOrNumber } from "@/modules/orders/service";
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

    const order = await getOrderByIdOrNumber(params.id, user, guestToken);

    if (!order) {
      return apiError("NOT_FOUND", "Order not found.", 404);
    }

    return apiSuccess(order);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Order detail GET error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve order details.", 500);
  }
}
