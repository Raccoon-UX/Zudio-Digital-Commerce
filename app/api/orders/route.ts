import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { createOrder, getUserOrders } from "@/modules/orders/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required to view your orders.", 401);
    }

    const orders = await getUserOrders(user.id);
    return apiSuccess(orders);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Orders GET error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve orders.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const sessionToken = request.cookies.get("zudio_cart_session")?.value;
    const body = await request.json();

    const order = await createOrder(body, user?.id, user ? null : sessionToken);

    return apiSuccess(order, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode, error.details);
    }
    console.error("Order creation error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to place order.", 500);
  }
}
