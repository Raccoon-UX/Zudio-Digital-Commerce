import { NextResponse } from "next/server";

export type ErrorCode =
  | "PRODUCT_NOT_FOUND"
  | "VARIANT_NOT_FOUND"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_REQUEST"
  | "INVALID_STATE"
  | "CONCURRENCY_ERROR"
  | "NOT_FOUND"
  | "PAYMENT_FAILED"
  | "PAYMENT_VERIFICATION_FAILED"
  | "STORE_NOT_FOUND"
  | "RESERVATION_NOT_FOUND"
  | "RESERVATION_EXPIRED"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR";

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: ErrorCode = "INTERNAL_SERVER_ERROR", statusCode = 500, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function apiError(code: ErrorCode, message: string, statusCode = 400, details?: unknown) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status: statusCode }
  );
}

export function apiSuccess<T>(data: T, statusCode = 200, meta?: Record<string, unknown>) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      data,
      meta,
    },
    { status: statusCode }
  );
}
