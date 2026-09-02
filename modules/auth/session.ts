import { getServerSession } from "next-auth";
import { authOptions } from "./auth.config";
import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "STORE_STAFF" | "ADMIN";
}

/**
 * Get current authenticated user session on server with resilient database ID resolution.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const rawUser = session.user as any;
  const rawId = rawUser.id || rawUser.sub;
  const rawEmail = rawUser.email ? rawUser.email.toLowerCase().trim() : null;

  // 1. If we have a user ID, verify it exists in Supabase
  if (rawId) {
    const dbUserById = await prisma.user.findUnique({
      where: { id: rawId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (dbUserById) {
      return {
        id: dbUserById.id,
        email: dbUserById.email,
        name: dbUserById.name,
        role: dbUserById.role as any,
      };
    }
  }

  // 2. Fallback: If ID is missing or was from a previous database instance, resolve via email
  if (rawEmail) {
    const dbUserByEmail = await prisma.user.findUnique({
      where: { email: rawEmail },
      select: { id: true, email: true, name: true, role: true },
    });
    if (dbUserByEmail) {
      return {
        id: dbUserByEmail.id,
        email: dbUserByEmail.email,
        name: dbUserByEmail.name,
        role: dbUserByEmail.role as any,
      };
    }
  }

  return null;
}

/**
 * Enforce authentication on protected server routes
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError("Authentication required. Please sign in.", "UNAUTHORIZED", 401);
  }
  return user;
}

/**
 * Enforce Admin role on protected routes
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new AppError("Access denied. Administrator privileges required.", "FORBIDDEN", 403);
  }
  return user;
}
