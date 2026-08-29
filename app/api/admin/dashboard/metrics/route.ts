import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getDashboardMetrics, requireAdminUser } from "@/modules/admin/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    requireAdminUser(user);

    const metrics = await getDashboardMetrics();
    return apiSuccess(metrics);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Admin metrics API error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve dashboard metrics.", 500);
  }
}
