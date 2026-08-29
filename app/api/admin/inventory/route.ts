import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getAdminInventory, adjustAdminInventory, requireAdminUser } from "@/modules/admin/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAdminUser(user);

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || undefined;
    const lowStockOnly = searchParams.get("lowStock") === "true";

    const inventory = await getAdminInventory(storeId, lowStockOnly);
    return apiSuccess(inventory);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Admin inventory fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve store inventory matrix.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAdminUser(user);

    const body = await request.json();
    const { storeId, variantId, newQuantity, reason } = body;

    if (!storeId || !variantId || newQuantity === undefined) {
      return apiError("INVALID_REQUEST", "Store ID, Variant ID, and new quantity are required.", 400);
    }

    const updated = await adjustAdminInventory(
      storeId,
      variantId,
      Number(newQuantity),
      reason,
      user!
    );

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Admin inventory adjust error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to adjust store inventory.", 500);
  }
}
