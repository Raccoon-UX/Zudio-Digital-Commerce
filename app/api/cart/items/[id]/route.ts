import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { updateCartItemQuantity, removeCartItem } from "@/modules/cart/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const sessionToken = request.cookies.get("zudio_cart_session")?.value;

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || typeof quantity !== "number") {
      return apiError("INVALID_REQUEST", "Quantity is required as a number.", 400);
    }

    const updatedCart = await updateCartItemQuantity(
      params.id,
      quantity,
      user?.id,
      user ? null : sessionToken
    );

    return apiSuccess(updatedCart);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to update cart item", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const sessionToken = request.cookies.get("zudio_cart_session")?.value;

    const updatedCart = await removeCartItem(
      params.id,
      user?.id,
      user ? null : sessionToken
    );

    return apiSuccess(updatedCart);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to remove cart item", 500);
  }
}
