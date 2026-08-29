import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { validateCheckout } from "@/modules/orders/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const sessionToken = request.cookies.get("zudio_cart_session")?.value;

    const validation = await validateCheckout(user?.id, user ? null : sessionToken);
    return apiSuccess(validation);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode, error.details);
    }
    console.error("Checkout validation error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to validate checkout.", 500);
  }
}
