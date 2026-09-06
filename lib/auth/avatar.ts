/**
 * Avatar image validation and binary processing utility for Zudio Digital Commerce.
 * Enforces strict MIME, magic byte, and size checks.
 * Ensures User.image and JWT cookies store only lightweight URL paths (/api/user/avatar/<userId>).
 */

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB binary limit
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface ProcessedAvatarBuffer {
  isValid: boolean;
  error?: string;
  buffer?: Buffer;
  mimeType?: AllowedMimeType;
  size?: number;
}

export interface GoogleUrlValidationResult {
  isValid: boolean;
  error?: string;
  cleanUrl?: string | null;
}

/**
 * Builds the canonical lightweight avatar endpoint URL for a user.
 */
export function buildAvatarEndpointUrl(userId: string): string {
  return `/api/user/avatar/${encodeURIComponent(userId)}`;
}

/**
 * Validates and sanitizes external Google OAuth photo URLs.
 */
export function validateGoogleAvatarUrl(input: unknown): GoogleUrlValidationResult {
  if (input === null || input === undefined || input === "") {
    return { isValid: true, cleanUrl: null };
  }

  if (typeof input !== "string") {
    return { isValid: false, error: "Google avatar URL must be a string." };
  }

  const trimmed = input.trim();
  if (!trimmed.startsWith("https://")) {
    return { isValid: false, error: "Avatar URL must use HTTPS." };
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();

    // Prevent SSRF / internal hostname traversal
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return { isValid: false, error: "Disallowed avatar URL hostname." };
    }

    return { isValid: true, cleanUrl: trimmed };
  } catch {
    return { isValid: false, error: "Invalid avatar URL format." };
  }
}

/**
 * Validates raw binary or Base64 upload payload and extracts safe binary Buffer.
 */
export function validateAndExtractAvatarBuffer(input: unknown): ProcessedAvatarBuffer {
  if (!input) {
    return { isValid: false, error: "No avatar data provided." };
  }

  let buffer: Buffer;
  let declaredMime: string | undefined;

  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (input instanceof Uint8Array) {
    buffer = Buffer.from(input);
  } else if (typeof input === "string") {
    const trimmed = input.trim();

    // 1. Data URL format: data:image/(jpeg|jpg|png|webp);base64,<base64>
    const dataUrlMatch = trimmed.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/);
    if (dataUrlMatch) {
      declaredMime = dataUrlMatch[1] === "image/jpg" ? "image/jpeg" : dataUrlMatch[1];
      try {
        buffer = Buffer.from(dataUrlMatch[3], "base64");
      } catch {
        return { isValid: false, error: "Failed to decode Base64 image payload." };
      }
    } else {
      // 2. Raw Base64 string fallback
      try {
        buffer = Buffer.from(trimmed, "base64");
      } catch {
        return { isValid: false, error: "Invalid image encoding." };
      }
    }
  } else {
    return { isValid: false, error: "Unsupported image input type." };
  }

  // Check size limit (max 2MB)
  if (buffer.length === 0) {
    return { isValid: false, error: "Image file is empty." };
  }

  if (buffer.length > MAX_AVATAR_BYTES) {
    return {
      isValid: false,
      error: `Image size exceeds the 2MB limit (size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  // Magic Byte Header Validation
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isWebp =
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 && // 'RIFF'
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50; // 'WEBP'

  if (!isJpeg && !isPng && !isWebp) {
    return {
      isValid: false,
      error: "Invalid image format. Content does not match a valid JPEG, PNG, or WebP file.",
    };
  }

  const detectedMime: AllowedMimeType = isJpeg
    ? "image/jpeg"
    : isPng
    ? "image/png"
    : "image/webp";

  if (declaredMime && declaredMime !== detectedMime) {
    return {
      isValid: false,
      error: `Declared MIME type (${declaredMime}) does not match detected binary format (${detectedMime}).`,
    };
  }

  return {
    isValid: true,
    buffer,
    mimeType: detectedMime,
    size: buffer.length,
  };
}
