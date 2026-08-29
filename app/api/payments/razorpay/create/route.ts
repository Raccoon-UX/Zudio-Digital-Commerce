import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { createRazorpayPaymentOrder } from "@/modules/payments/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "payment_create", 10, 60 * 1000);
    const user = await getCurrentUser();
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return apiError("INVALID_REQUEST", "Order ID is required.", 400);
    }

    const razorpayOrder = await createRazorpayPaymentOrder(orderId, user?.id);

    return apiSuccess(razorpayOrder);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Razorpay order creation error:", error);
    return apiError("PAYMENT_FAILED", "Failed to initialize payment gateway order.", 500);
  }
}
