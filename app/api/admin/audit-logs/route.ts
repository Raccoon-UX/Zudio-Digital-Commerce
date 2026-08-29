import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getAdminAuditLogs, requireAdminUser } from "@/modules/admin/service";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAdminUser(user);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;

    const logs = await getAdminAuditLogs({ action, entityType });
    return apiSuccess(logs);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Admin audit logs fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve audit logs.", 500);
  }
}
