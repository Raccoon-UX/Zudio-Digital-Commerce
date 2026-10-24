"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ProductCardDTO } from "@/modules/products/types";
import { ChatMessage } from "@/modules/ai/types";
import { formatCurrency } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Casual outfit under ₹1,000",
  "Black oversized T-shirt in size M",
  "Recommend affordable footwear",
  "Trending dresses for women",
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome-msg",
  role: "assistant",
  content:
    "Hello! I am your ZOA AI Stylist powered by Gemma 4. Tell me what outfit, style, size, or budget you're looking for, and I will recommend real items from our store catalog.",
  createdAt: Date.now(),
};

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setErrorText(null);
    setInputValue("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Bounded history: send only last 4 previous turns (excluding initial greeting)
      const historyPayload = updatedMessages
        .filter((m) => m.id !== "welcome-msg")
        .slice(-5)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload.slice(0, -1), // previous history excluding current turn
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg =
          json.error?.message || "Failed to get styling recommendations. Please try again.";
        setErrorText(errorMsg);
        setIsLoading(false);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: json.data.message || "Here are recommendations from our catalog:",
        products: json.data.products || [],
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("[AiChatWidget] Network error:", err);
      setErrorText("Unable to reach the styling assistant. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* 1. Floating Chat Launcher Button */}
      <aside aria-label="AI Shopping Assistant Launcher" className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 ${
            isOpen
              ? "bg-neutral-800 text-white hover:bg-neutral-900"
              : "bg-neutral-950 text-white hover:bg-neutral-900 hover:shadow-black/25 hover:scale-105"
          }`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={isOpen ? "Close AI Shopping Assistant" : "Open AI Shopping Assistant"}
        >
          <div className="relative flex items-center justify-center">
            <MaterialIcon
              name={isOpen ? "close" : "auto_awesome"}
              size="md"
              className={isOpen ? "text-neutral-300" : "text-amber-300 animate-pulse"}
            />
          </div>
          <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
            {isOpen ? "Close AI" : "Ask AI Stylist"}
          </span>
          {!isOpen && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white text-neutral-950 tracking-tight ml-0.5">
              Gemma 4
            </span>
          )}
        </button>
      </aside>

      {/* 2. Expandable Chat Panel */}
      {isOpen && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="ZOA AI Shopping Assistant Chat"
          className="fixed inset-x-2 bottom-20 top-20 sm:inset-auto sm:bottom-20 sm:right-6 sm:w-[420px] sm:h-[600px] z-50 flex flex-col bg-white border border-neutral-200/90 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.18)] overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-neutral-950 text-white border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-amber-300 shadow-inner">
                <MaterialIcon name="auto_awesome" size="sm" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    ZOA AI Stylist
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 tracking-tight">
                    Gemma 4
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-medium">
                  Real-time catalog recommendations
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Close chat"
            >
              <MaterialIcon name="close" size="sm" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-neutral-950 text-white rounded-br-xs shadow-xs"
                      : "bg-white text-neutral-900 border border-neutral-200/80 rounded-bl-xs shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Grounded Product Recommendations Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 pl-1">
                      Recommended from Catalog:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => {
                            // On mobile, minimize to allow viewing product
                            if (window.innerWidth < 640) setIsOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 bg-white rounded-xl border border-neutral-200/90 hover:border-neutral-900 hover:shadow-sm transition-all group"
                        >
                          <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="56px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          <div className="flex-1 min-w-0 pr-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                              {product.categoryName}
                            </span>
                            <h4 className="text-xs font-bold text-neutral-900 truncate group-hover:text-black">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-neutral-950">
                                {formatCurrency(product.price)}
                              </span>
                              {product.compareAtPrice && product.compareAtPrice > product.price && (
                                <span className="text-[10px] text-neutral-400 line-through">
                                  {formatCurrency(product.compareAtPrice)}
                                </span>
                              )}
                            </div>
                            {product.availableSizes && product.availableSizes.length > 0 && (
                              <p className="text-[9px] text-neutral-500 mt-0.5 truncate">
                                Sizes: {product.availableSizes.slice(0, 4).join(", ")}
                              </p>
                            )}
                          </div>

                          <div className="p-1 text-neutral-400 group-hover:text-neutral-900 shrink-0">
                            <MaterialIcon name="arrow_forward" size="sm" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-neutral-200/80 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                    <span className="text-[11px] font-medium text-neutral-500 ml-1.5">
                      Finding styles in catalog...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message & Retry */}
            {errorText && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2">
                <MaterialIcon name="error_outline" size="sm" className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorText}</p>
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    className="mt-1 text-[11px] font-bold text-rose-900 underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Example Prompt Chips (shown if only initial message present) */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-2">
                <p className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-2">
                  Suggested inquiries:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] font-medium bg-white hover:bg-neutral-100 text-neutral-800 px-3 py-1.5 rounded-full border border-neutral-200/90 shadow-2xs transition-all active:scale-95 text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-white border-t border-neutral-200 shrink-0">
            <div className="flex items-center gap-2 bg-neutral-100 rounded-full px-3.5 py-1.5 border border-neutral-200/80 focus-within:border-neutral-900 focus-within:bg-white transition-all">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about styles, sizes, budgets..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.slice(0, 500))}
                onKeyDown={handleKeyDownInput}
                disabled={isLoading}
                maxLength={500}
                className="flex-1 bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:opacity-50"
                aria-label="Ask AI shopping assistant"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-950 transition-all shrink-0"
                aria-label="Send message"
              >
                <MaterialIcon name="arrow_upward" size="xs" />
              </button>
            </div>

            <div className="flex items-center justify-between px-2 pt-1.5 text-[9px] text-neutral-400">
              <span>Prices verified against live store inventory</span>
              {inputValue.length > 350 && (
                <span className={inputValue.length >= 500 ? "text-rose-600 font-bold" : ""}>
                  {inputValue.length}/500
                </span>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default AiChatWidget;
