import { NextRequest } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { getUserAddresses, createAddress } from "@/modules/orders/address-service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const addresses = await getUserAddresses(user.id);
    return apiSuccess(addresses);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve addresses", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { fullName, addressLine1, addressLine2, city, state, pincode, phone, isDefault } = body;

    if (!fullName || !addressLine1 || !city || !state || !pincode || !phone) {
      return apiError("INVALID_REQUEST", "Please fill in all required address fields.", 400);
    }

    const address = await createAddress(user.id, {
      fullName,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      phone,
      isDefault: Boolean(isDefault),
    });

    return apiSuccess(address, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    return apiError("INTERNAL_SERVER_ERROR", "Failed to save address", 500);
  }
}
