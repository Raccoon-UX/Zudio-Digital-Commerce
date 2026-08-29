import { NextRequest } from "next/server";
import { getCurrentUser, requireAuth } from "@/modules/auth/session";
import { getUserWishlist, toggleWishlistProduct, removeFromWishlist } from "@/modules/wishlist/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiSuccess({ items: [], count: 0 });
    }
    const wishlist = await getUserWishlist(user.id);
    return apiSuccess(wishlist);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve wishlist", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return apiError("INVALID_REQUEST", "Product ID is required.", 400);
    }

    const result = await toggleWishlistProduct(user.id, productId);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to toggle wishlist", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");

    if (!productId) {
      return apiError("INVALID_REQUEST", "Product ID is required.", 400);
    }

    await removeFromWishlist(user.id, productId);
    return apiSuccess({ removed: true });
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to remove wishlist item", 500);
  }
}
