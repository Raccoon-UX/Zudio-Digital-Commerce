"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartDTO } from "@/modules/cart/types";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function CartPage() {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (err) {
      console.error("Fetch cart error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    setUpdatingItemId(itemId);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (err) {
      console.error("Update quantity error:", err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItemId(itemId);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (err) {
      console.error("Remove item error:", err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 bg-white min-h-screen">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const isCartEmpty = !cart || cart.items.length === 0;

  return (
    <div className="py-10 bg-neutral-50 min-h-screen">
      <Container size="xl">
        {/* Header */}
        <div className="pb-6 mb-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              <span>Home</span> / <span className="text-black">Cart</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Shopping Bag {!isCartEmpty && `(${cart.itemCount} Items)`}
            </h1>
          </div>
          {!isCartEmpty && (
            <Link href="/products">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
                Continue Shopping
              </Button>
            </Link>
          )}
        </div>

        {isCartEmpty ? (
          <EmptyState
            title="Your bag is currently empty"
            description="Looks like you haven't added any items to your shopping bag yet. Explore our catalog for everyday trends."
            icon={ShoppingBag}
            actionLabel="Start Shopping"
            onAction={() => (window.location.href = "/products")}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Delivery Banner */}
              <div className="bg-white border border-neutral-200 p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-black">
                    <Truck className="h-4 w-4" />
                    <span>
                      {cart.amountNeededForFreeDelivery === 0
                        ? "You've unlocked Free Standard Delivery!"
                        : `Add ${formatCurrency(cart.amountNeededForFreeDelivery)} more for FREE Delivery`}
                    </span>
                  </div>
                  <span className="text-neutral-500 font-semibold">
                    Threshold: {formatCurrency(cart.freeDeliveryThreshold)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-100 h-2 overflow-hidden border border-neutral-200">
                  <div
                    className="bg-black h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (cart.subtotal / cart.freeDeliveryThreshold) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Items Card List */}
              <div className="bg-white border border-neutral-200 divide-y divide-neutral-100 shadow-sm">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Item Image + Details */}
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="relative aspect-[3/4] w-20 sm:w-24 overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0"
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="100px"
                          className="object-cover object-center"
                        />
                      </Link>

                      <div className="space-y-1">
                        <Link href={`/products/${item.productSlug}`}>
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-black hover:underline">
                            {item.productName}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                          <span className="bg-neutral-100 px-2 py-0.5 border border-neutral-200 text-neutral-800 font-medium">
                            Size: {item.size}
                          </span>
                          <span className="bg-neutral-100 px-2 py-0.5 border border-neutral-200 text-neutral-800 font-medium flex items-center gap-1">
                            <span
                              className="h-2 w-2 rounded-full border border-neutral-300"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            {item.color}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          SKU: {item.sku}
                        </p>
                        <div className="text-xs font-black text-black pt-1">
                          {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper + Line Total + Remove */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                      {/* Stepper */}
                      <div className="flex items-center border border-neutral-300 bg-white">
                        <button
                          type="button"
                          disabled={updatingItemId === item.id}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 disabled:opacity-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={updatingItemId === item.id || item.quantity >= 10}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 disabled:opacity-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-sm font-black text-black min-w-[70px] text-right">
                        {formatCurrency(item.subtotal)}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        disabled={updatingItemId === item.id}
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1.5"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-4 bg-white border border-neutral-200 p-6 shadow-sm space-y-6 sticky top-28">
              <h3 className="text-sm font-black uppercase tracking-wider text-black pb-3 border-b border-neutral-200">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Bag Subtotal ({cart.itemCount} items)</span>
                  <span className="font-bold text-black">
                    {formatCurrency(cart.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Estimated Delivery Fee</span>
                  <span>
                    {cart.deliveryFee === 0 ? (
                      <strong className="text-emerald-700 uppercase">FREE</strong>
                    ) : (
                      formatCurrency(cart.deliveryFee)
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="text-sm font-black uppercase tracking-wide text-black">
                    Total Amount
                  </span>
                  <span className="text-lg font-black text-black">
                    {formatCurrency(cart.total)}
                  </span>
                </div>
              </div>

              <Link href="/checkout" className="block">
                <Button variant="primary" size="lg" className="w-full text-xs tracking-wider">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <div className="p-3 bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-500 space-y-1.5">
                <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-black shrink-0" />
                  <span>Secure & Verified Checkout</span>
                </div>
                <p>
                  Prices are recalculated and stock availability is verified server-side at checkout.
                </p>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
