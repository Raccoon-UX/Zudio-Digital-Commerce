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
 * Get current authenticated user session on server.
 * Uses cryptographically verified JWT data directly to eliminate redundant DB roundtrips.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const rawUser = session.user as any;
  const rawId = rawUser.id || rawUser.sub;
  const rawEmail = rawUser.email ? rawUser.email.toLowerCase().trim() : null;

  // If we have an ID and email from the verified JWT, return immediately without extra DB query
  if (rawId && rawEmail) {
    return {
      id: rawId,
      email: rawEmail,
      name: rawUser.name || "User",
      role: rawUser.role || "CUSTOMER",
    };
  }

  // Fallback: If ID is missing, resolve once via email
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
 * Enforce Admin role on protected routes with strict database privilege check.
 * Guarantees zero privilege escalation by verifying the active DB record.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new AppError("Access denied. Administrator privileges required.", "FORBIDDEN", 403);
  }

  // Authoritative database check for admin operations
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new AppError("Access denied. Administrator privileges required.", "FORBIDDEN", 403);
  }

  return user;
}
