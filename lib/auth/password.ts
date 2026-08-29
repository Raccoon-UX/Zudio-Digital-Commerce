import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password with a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate registration password requirements (minimum 8 characters)
 */
export function validatePasswordPolicy(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long.",
    };
  }
  return { isValid: true };
}
