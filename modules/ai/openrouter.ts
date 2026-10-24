import { AppError } from "@/lib/errors";
import {
  OpenRouterChatRequest,
  OpenRouterSuccessResponse,
  OpenRouterErrorResponse,
} from "./types";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemma-4-26b-a4b-it";
const REQUEST_TIMEOUT_MS = 15000;
const MAX_OUTPUT_TOKENS = 600;

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  endpoint: string;
}

/**
 * Retrieve verified OpenRouter configuration from server environment variables.
 * Never accessible client-side.
 */
export function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

  if (!apiKey || apiKey === "your_openrouter_api_key_here") {
    throw new AppError(
      "AI Shopping Assistant is temporarily unavailable. Please check back shortly.",
      "AI_SERVICE_UNAVAILABLE",
      503
    );
  }

  return {
    apiKey,
    model,
    endpoint: OPENROUTER_ENDPOINT,
  };
}

/**
 * Call OpenRouter Chat Completions endpoint with resilience, timeouts, and sanitized error handling.
 */
export async function callOpenRouter(
  messages: OpenRouterChatRequest["messages"],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormatJson?: boolean;
    fetcher?: typeof fetch;
  }
): Promise<string> {
  const config = getOpenRouterConfig();
  const activeModel = options?.model || config.model;
  const activeFetcher = options?.fetcher || fetch;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const requestPayload: OpenRouterChatRequest = {
    model: activeModel,
    messages,
    max_tokens: options?.maxTokens || MAX_OUTPUT_TOKENS,
    temperature: options?.temperature ?? 0.2,
  };

  if (options?.responseFormatJson) {
    requestPayload.response_format = { type: "json_object" };
  }

  try {
    const response = await activeFetcher(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": "https://zoa.demo",
        "X-Title": "ZOA Digital Commerce",
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = "AI provider encountered an error.";
      try {
        const errorJson = (await response.json()) as OpenRouterErrorResponse;
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Fallback to HTTP status text
        errorMessage = response.statusText || errorMessage;
      }

      console.error(`[OpenRouter HTTP ${response.status}] ${errorMessage}`);

      if (response.status === 429) {
        throw new AppError(
          "AI Shopping Assistant is currently busy. Please retry in a few moments.",
          "RATE_LIMIT_EXCEEDED",
          429
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new AppError(
          "AI Shopping Assistant authentication failed. Please contact support.",
          "AI_SERVICE_UNAVAILABLE",
          503
        );
      }

      throw new AppError(
        "AI Shopping Assistant could not complete your request. Please try again.",
        "AI_SERVICE_UNAVAILABLE",
        502
      );
    }

    const data = (await response.json()) as OpenRouterSuccessResponse;
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string" || content.trim().length === 0) {
      throw new AppError(
        "Received empty response from AI assistant. Please retry.",
        "INTERNAL_SERVER_ERROR",
        502
      );
    }

    return content.trim();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      console.error("[OpenRouter] Request timed out after", REQUEST_TIMEOUT_MS, "ms");
      throw new AppError(
        "AI assistant took too long to respond. Please try a simpler question or search directly.",
        "AI_SERVICE_UNAVAILABLE",
        504
      );
    }

    console.error("[OpenRouter] Unexpected error:", error);
    throw new AppError(
      "Unable to communicate with AI shopping assistant. Please try again.",
      "AI_SERVICE_UNAVAILABLE",
      503
    );
  }
}
