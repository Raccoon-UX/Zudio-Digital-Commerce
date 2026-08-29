import { NextRequest } from "next/server";
import { handleRazorpayWebhook } from "@/modules/payments/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "payment_webhook", 60, 60 * 1000);
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const result = await handleRazorpayWebhook(rawBody, signature);

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Razorpay webhook error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Webhook processing failed.", 500);
  }
}
