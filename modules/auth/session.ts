import { getServerSession } from "next-auth";
import { authOptions } from "./auth.config";
import { AppError } from "@/lib/errors";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "STORE_STAFF" | "ADMIN";
}

/**
 * Get current authenticated user session on server
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as unknown as SessionUser;
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
