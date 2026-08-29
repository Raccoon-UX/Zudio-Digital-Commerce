import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { createRazorpayPaymentOrder } from "@/modules/payments/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const razorpayOrder = await createRazorpayPaymentOrder(params.id, user?.id);

    return apiSuccess(razorpayOrder);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Retry payment error:", error);
    return apiError("PAYMENT_FAILED", "Failed to re-initialize payment.", 500);
  }
}
