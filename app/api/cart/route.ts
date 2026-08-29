import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getCart, clearCart, getOrCreateCart } from "@/modules/cart/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    let sessionToken = request.cookies.get("zudio_cart_session")?.value;
    let shouldSetCookie = false;

    if (!user && !sessionToken) {
      sessionToken = "guest_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      shouldSetCookie = true;
    }

    const cart = await getCart(user?.id, user ? null : sessionToken);

    const response = apiSuccess(cart);

    if (shouldSetCookie && sessionToken) {
      response.cookies.set({
        name: "zudio_cart_session",
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Cart GET error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve cart", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const sessionToken = request.cookies.get("zudio_cart_session")?.value;

    const cart = await getOrCreateCart(user?.id, user ? null : sessionToken);
    await clearCart(cart.id);

    const updatedCart = await getCart(user?.id, user ? null : sessionToken);
    return apiSuccess(updatedCart);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to clear cart", 500);
  }
}
