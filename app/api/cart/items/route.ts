import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { addToCart } from "@/modules/cart/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    let sessionToken = request.cookies.get("zudio_cart_session")?.value;
    let shouldSetCookie = false;

    if (!user && !sessionToken) {
      sessionToken = "guest_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      shouldSetCookie = true;
    }

    const body = await request.json();
    const { variantId, quantity = 1 } = body;

    if (!variantId) {
      return apiError("INVALID_REQUEST", "Variant ID is required.", 400);
    }

    const updatedCart = await addToCart(
      variantId,
      parseInt(quantity, 10) || 1,
      user?.id,
      user ? null : sessionToken
    );

    const response = apiSuccess(updatedCart, 201);

    if (shouldSetCookie && sessionToken) {
      response.cookies.set({
        name: "zudio_cart_session",
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Add to cart error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to add item to cart", 500);
  }
}
