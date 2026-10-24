import { NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { apiSuccess, apiError, AppError } from "@/lib/errors";
import { chatRequestSchema } from "@/modules/ai/types";
import { handleAiShoppingChat } from "@/modules/ai/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Sliding Window Rate Limiting (15 requests per minute per IP)
    enforceRateLimit(request, "ai-chat", 15, 60 * 1000);

    // 2. Parse and Validate Request Payload
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("INVALID_REQUEST", "Invalid JSON request body.", 400);
    }

    const validationResult = chatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return apiError(
        "INVALID_REQUEST",
        firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validation failed.",
        400,
        validationResult.error.flatten()
      );
    }

    // 3. Process Shopping Assistant Query grounded in Real Catalog
    const responseData = await handleAiShoppingChat(validationResult.data);

    // 4. Return Structured Success Response with strict Private Cache Headers
    return apiSuccess(
      responseData,
      200,
      undefined,
      {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      }
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode, error.details);
    }

    console.error("[API /api/ai/chat] Unexpected error:", error);
    return apiError(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while processing your request. Please try again.",
      500
    );
  }
}
