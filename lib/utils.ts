import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in Indian Rupee (INR)
 */
export function formatCurrency(amount: number | string | bigint | null | undefined): string {
  if (amount === null || amount === undefined) return "₹0";
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Format date in readable format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Generate human-readable SKU or order number
 */
export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ZUD-${dateStr}-${randomStr}`;
}

export function generateReservationNumber(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `RES-${randomDigits}`;
}
