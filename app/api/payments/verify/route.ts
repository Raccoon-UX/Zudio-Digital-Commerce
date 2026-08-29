import { NextRequest } from "next/server";
import { verifyPaymentSignature } from "@/modules/payments/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "payment_verify", 15, 60 * 1000);
    const body = await request.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = body;

    const result = await verifyPaymentSignature({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Payment verification route error:", error);
    return apiError("PAYMENT_VERIFICATION_FAILED", "Payment verification could not be completed.", 500);
  }
}
