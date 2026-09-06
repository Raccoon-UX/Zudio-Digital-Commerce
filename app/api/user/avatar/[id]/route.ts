import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = params?.id?.trim();
    if (!userId) {
      return new NextResponse("User ID required", { status: 400 });
    }

    const avatar = await prisma.userAvatar.findUnique({
      where: { userId },
      select: {
        data: true,
        mimeType: true,
        size: true,
        updatedAt: true,
      },
    });

    if (!avatar || !avatar.data) {
      return new NextResponse("Avatar not found", { status: 404 });
    }

    // ETag caching for browser efficiency
    const etag = `"${userId}-${avatar.updatedAt.getTime()}"`;
    const ifNoneMatch = request.headers.get("if-none-match");

    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "ETag": etag,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    // Return binary stream with proper MIME type and caching headers
    return new NextResponse(avatar.data, {
      status: 200,
      headers: {
        "Content-Type": avatar.mimeType,
        "Content-Length": String(avatar.size),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "ETag": etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Avatar streaming error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
