import { z } from "zod";
import { ProductCardDTO } from "@/modules/products/types";

// -----------------------------------------------------------------------------
// CHAT CONVERSATION TYPES
// -----------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ProductCardDTO[];
  createdAt: number;
}

// -----------------------------------------------------------------------------
// REQUEST VALIDATION (ZOD)
// -----------------------------------------------------------------------------

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1, "Message cannot be empty").max(500, "Message cannot exceed 500 characters"),
});

export const chatRequestSchema = z.object({
  message: z
    .string({ required_error: "Message is required" })
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Message must not exceed 500 characters"),
  history: z
    .array(chatMessageSchema)
    .max(6, "Conversation history cannot exceed 6 messages")
    .optional()
    .default([]),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

// -----------------------------------------------------------------------------
// RESPONSE TYPES
// -----------------------------------------------------------------------------

export interface ChatResponseData {
  message: string;
  products: ProductCardDTO[];
}

// -----------------------------------------------------------------------------
// OPENROUTER API TYPES
// -----------------------------------------------------------------------------

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" };
}

export interface OpenRouterChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string | null;
}

export interface OpenRouterSuccessResponse {
  id: string;
  choices: OpenRouterChoice[];
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterErrorResponse {
  error?: {
    message: string;
    code?: number | string;
    metadata?: unknown;
  };
}

// Structured schema expected from the model in JSON mode
export const modelOutputSchema = z.object({
  reply: z.string().default("Here are recommendations from our catalog:"),
  recommendedProductIds: z.array(z.string()).default([]),
});

export type ModelOutput = z.infer<typeof modelOutputSchema>;
