import { NextRequest } from "next/server";
import { AppError } from "./errors";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory token store for API abuse protection
const ipRequestStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    ipRequestStore.forEach((record, key) => {
      if (now > record.resetAt) {
        ipRequestStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Check rate limit for a given request.
 * @param req NextRequest
 * @param endpointIdentifier Unique identifier for the endpoint/action
 * @param maxRequests Maximum allowed requests in the time window
 * @param windowMs Window duration in milliseconds (default: 60,000ms / 1 min)
 */
export function checkRateLimit(
  req: NextRequest,
  endpointIdentifier: string,
  maxRequests: number = 20,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInSec: number } {
  // Extract client IP (checking standard proxy headers)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  const key = `${endpointIdentifier}:${clientIp}`;
  const now = Date.now();
  const existing = ipRequestStore.get(key);

  if (!existing || now > existing.resetAt) {
    ipRequestStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSec: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= maxRequests) {
    const resetInSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSec,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetInSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/**
 * Enforce rate limit or throw HTTP 429 Too Many Requests
 */
export function enforceRateLimit(
  req: NextRequest,
  endpointIdentifier: string,
  maxRequests: number = 20,
  windowMs: number = 60 * 1000
) {
  const result = checkRateLimit(req, endpointIdentifier, maxRequests, windowMs);
  if (!result.allowed) {
    throw new AppError(
      `Rate limit exceeded. Too many requests. Please retry in ${result.resetInSec} seconds.`,
      "RATE_LIMIT_EXCEEDED",
      429,
      { retryAfterSec: result.resetInSec }
    );
  }
}
