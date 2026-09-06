import { NextRequest } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { prisma } from "@/lib/prisma/client";
import { apiSuccess, apiError, AppError } from "@/lib/errors";
import { validateAndExtractAvatarBuffer, buildAvatarEndpointUrl } from "@/lib/auth/avatar";

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
        image: true,
        googleImage: true,
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
          image: true,
          googleImage: true,
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
      image: userRecord.image,
      googleImage: userRecord.googleImage,
      avatarUrl: userRecord.image || userRecord.googleImage || null,
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
    const { name, phone, image } = body;

    const dataToUpdate: { name?: string; phone?: string | null; image?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return apiError("INVALID_REQUEST", "Full name cannot be empty.", 400);
      }
      dataToUpdate.name = name.trim();
    }

    if (phone !== undefined) {
      dataToUpdate.phone = phone ? String(phone).trim() : null;
    }

    // Avatar binary processing and URL path assignment
    let avatarBufferToSave: { buffer: Buffer; mimeType: string; size: number } | null = null;
    let shouldDeleteAvatar = false;

    if (image !== undefined) {
      if (image === null) {
        shouldDeleteAvatar = true;
        dataToUpdate.image = null;
      } else {
        const validation = validateAndExtractAvatarBuffer(image);
        if (!validation.isValid || !validation.buffer) {
          return apiError("INVALID_REQUEST", validation.error || "Invalid avatar image format.", 400);
        }
        avatarBufferToSave = {
          buffer: validation.buffer,
          mimeType: validation.mimeType!,
          size: validation.size!,
        };
        // Store canonical lightweight URL endpoint
        dataToUpdate.image = buildAvatarEndpointUrl(user.id);
      }
    }

    // Atomic transaction: update user and UserAvatar binary storage
    const updatedUser = await prisma.$transaction(async (tx) => {
      if (shouldDeleteAvatar) {
        await tx.userAvatar.deleteMany({
          where: { userId: user.id },
        });
      } else if (avatarBufferToSave) {
        await tx.userAvatar.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            data: avatarBufferToSave.buffer,
            mimeType: avatarBufferToSave.mimeType,
            size: avatarBufferToSave.size,
          },
          update: {
            data: avatarBufferToSave.buffer,
            mimeType: avatarBufferToSave.mimeType,
            size: avatarBufferToSave.size,
          },
        });
      }

      return tx.user.update({
        where: { id: user.id },
        data: dataToUpdate,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          googleImage: true,
          role: true,
        },
      });
    });

    const responsePayload = {
      ...updatedUser,
      avatarUrl: updatedUser.image || updatedUser.googleImage || null,
    };

    return apiSuccess(responsePayload);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    console.error("Profile update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to update profile.", 500);
  }
}
