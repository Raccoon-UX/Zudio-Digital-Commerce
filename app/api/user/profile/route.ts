import { NextRequest } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { prisma } from "@/lib/prisma/client";
import { apiSuccess, apiError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();

    let userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
        wishlist: {
          select: {
            _count: {
              select: { items: true },
            },
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!userRecord && user.email) {
      userRecord = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase().trim() },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
          wishlist: {
            select: {
              _count: {
                select: { items: true },
              },
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });
    }

    if (!userRecord) {
      return apiError("UNAUTHORIZED", "User profile not found. Please sign in again.", 404);
    }

    const payload = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
      addresses: userRecord.addresses,
      _count: {
        orders: userRecord._count.orders,
        wishlist: userRecord.wishlist?._count.items || 0,
      },
    };

    return apiSuccess(payload);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Profile fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to retrieve user profile.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, phone } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return apiSuccess(updatedUser);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Profile update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to update profile.", 500);
  }
}
