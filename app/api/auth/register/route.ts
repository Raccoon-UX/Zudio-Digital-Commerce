import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { hashPassword, validatePasswordPolicy } from "@/lib/auth/password";
import { apiSuccess, apiError, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "auth_register", 5, 60 * 1000);
    const body = await request.json();
    const { name, email, password, phone } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return apiError("INVALID_REQUEST", "Full name is required.", 400);
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return apiError("INVALID_REQUEST", "A valid email address is required.", 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Password validation (8+ characters as specified)
    const policyCheck = validatePasswordPolicy(password);
    if (!policyCheck.isValid) {
      return apiError("INVALID_REQUEST", policyCheck.message || "Password does not meet requirements.", 400);
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return apiError("INVALID_REQUEST", "An account with this email already exists.", 400);
    }

    const passwordHash = await hashPassword(password);

    // Create user and initialize cart + wishlist
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          phone: phone ? phone.trim() : null,
          role: "CUSTOMER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      // Initialize empty user cart & wishlist
      await tx.cart.create({
        data: { userId: newUser.id },
      });

      await tx.wishlist.create({
        data: { userId: newUser.id },
      });

      return newUser;
    });

    return apiSuccess(user, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("User registration error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to create user account. Please check database connection.", 500);
  }
}
