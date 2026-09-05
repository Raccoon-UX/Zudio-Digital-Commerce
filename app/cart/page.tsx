"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { CartDTO } from "@/modules/cart/types";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setError(null);
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      } else {
        setError(data.error?.message || "Failed to retrieve shopping bag.");
      }
    } catch (err) {
      console.error("Fetch cart error:", err);
      setError("Unable to connect to shopping bag service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (updatingItemId === itemId) return;
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
    if (updatingItemId === itemId) return;
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
      <div className="py-8 sm:py-12 bg-stitch-surface-base min-h-screen">
        <Container size="xl">
          <div className="mb-6 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <div className="bg-stitch-surface-base border border-stitch-border rounded-lg p-6 space-y-6">
                <div className="flex gap-4">
                  <Skeleton className="w-20 sm:w-24 aspect-[3/4] shrink-0 rounded" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Skeleton className="w-20 sm:w-24 aspect-[3/4] shrink-0 rounded" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 bg-stitch-surface-base min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-stitch-surface-container border border-rose-200 inline-block rounded-full mb-4">
            <MaterialIcon name="error" size="xl" className="text-stitch-error" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-stitch-primary mb-2">
            Shopping Bag Unavailable
          </h2>
          <p className="text-xs text-stitch-secondary-text mb-6 max-w-sm mx-auto">
            {error}
          </p>
          <Button variant="primary" size="md" onClick={fetchCart}>
            Try Again
          </Button>
        </Container>
      </div>
    );
  }

  const isCartEmpty = !cart || cart.items.length === 0;

  return (
    <div className="py-6 sm:py-10 bg-stitch-surface-base min-h-screen text-stitch-primary font-sans pb-28 lg:pb-12">
      <Container size="xl">
        {/* Header & Breadcrumb */}
        <div className="pb-5 mb-6 border-b border-stitch-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-stitch-secondary-text uppercase tracking-wider mb-1">
              <Link href="/" className="hover:text-stitch-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-stitch-primary font-bold">Cart</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-stitch-primary flex items-baseline gap-2">
              Shopping Bag
              {!isCartEmpty && (
                <span className="text-xs sm:text-sm font-normal text-stitch-secondary-text tracking-normal">
                  ({cart.itemCount} {cart.itemCount === 1 ? "Item" : "Items"})
                </span>
              )}
            </h1>
          </div>
          {!isCartEmpty && (
            <Link href="/products" className="hidden sm:inline-block">
              <Button variant="outline" size="sm" className="text-xs font-bold uppercase tracking-wider">
                Continue Shopping
              </Button>
            </Link>
          )}
        </div>

        {isCartEmpty ? (
          /* Empty Bag State matching Stitch screen */
          <div className="py-16 sm:py-24 text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-stitch-surface-container border border-stitch-border rounded-full flex items-center justify-center mx-auto mb-6 text-stitch-secondary-text">
              <MaterialIcon name="shopping_bag" size="xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stitch-primary mb-2">
              Your bag is empty
            </h2>
            <p className="text-xs sm:text-sm text-stitch-secondary-text mb-8">
              Looks like you haven&apos;t added anything yet. Discover our latest trends.
            </p>
            <Link href="/products" className="inline-block w-full max-w-[240px]">
              <Button variant="primary" size="lg" className="w-full text-xs font-bold uppercase tracking-wider">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          /* Active Cart State */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Delivery Progress & Cart Items */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Delivery Milestone Card */}
              <div className="bg-stitch-surface-container/60 border border-stitch-border p-4 sm:p-5 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-stitch-primary">
                    <MaterialIcon
                      name="local_shipping"
                      size="sm"
                      className={cart.amountNeededForFreeDelivery === 0 ? "text-stitch-accent" : "text-stitch-primary"}
                    />
                    <span>
                      {cart.amountNeededForFreeDelivery === 0
                        ? "🎉 You've unlocked FREE Standard Delivery!"
                        : `Add ${formatCurrency(cart.amountNeededForFreeDelivery)} more for FREE Delivery`}
                    </span>
                  </div>
                  <span className="text-stitch-secondary-text text-[11px] font-semibold hidden sm:inline">
                    Threshold: {formatCurrency(cart.freeDeliveryThreshold)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-200/70 h-2 rounded-full overflow-hidden border border-stitch-border/50">
                  <div
                    className={
                      cart.amountNeededForFreeDelivery === 0
                        ? "bg-stitch-accent h-full transition-all duration-500 rounded-full"
                        : "bg-stitch-primary h-full transition-all duration-500 rounded-full"
                    }
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
              <div className="bg-stitch-surface-base border border-stitch-border divide-y divide-stitch-border rounded-lg shadow-xs overflow-hidden">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 flex gap-4 sm:gap-6 items-start relative group"
                  >
                    {/* Item Thumbnail */}
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="relative w-20 sm:w-24 aspect-[3/4] overflow-hidden bg-stitch-surface-container rounded shrink-0 border border-stitch-border"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="(max-width: 640px) 80px, 96px"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between min-h-[100px]">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link href={`/products/${item.productSlug}`}>
                            <h3 className="font-bold text-xs sm:text-sm text-stitch-primary hover:underline line-clamp-2 uppercase tracking-wide leading-tight">
                              {item.productName}
                            </h3>
                          </Link>
                          {/* Close/Remove Button */}
                          <button
                            type="button"
                            disabled={updatingItemId === item.id}
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-stitch-secondary-text hover:text-stitch-primary transition-colors p-1 -mr-1 -mt-1 active:scale-95 disabled:opacity-50"
                            aria-label="Remove item"
                            title="Remove item"
                          >
                            <MaterialIcon name="close" size="sm" />
                          </button>
                        </div>

                        {/* Variant Attributes */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stitch-secondary-text mt-1.5">
                          <span className="flex items-center gap-1">
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-neutral-300"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            Color: <strong className="text-stitch-primary font-semibold">{item.color}</strong>
                          </span>
                          <span>|</span>
                          <span>
                            Size: <strong className="text-stitch-primary font-semibold">{item.size}</strong>
                          </span>
                        </div>

                        <p className="text-[10px] text-stitch-secondary-text font-mono mt-1">
                          SKU: {item.sku}
                        </p>
                      </div>

                      {/* Stepper + Subtotal Row */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-stitch-border/60">
                        {/* Stepper */}
                        <div className="flex items-center border border-stitch-border bg-stitch-surface-base rounded h-8">
                          <button
                            type="button"
                            disabled={updatingItemId === item.id || item.quantity <= 1}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="px-2 h-full text-stitch-secondary-text hover:text-stitch-primary disabled:opacity-40 transition-colors active:bg-stitch-surface-container"
                            aria-label="Decrease quantity"
                          >
                            <MaterialIcon name="remove" size="xs" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-stitch-primary">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={updatingItemId === item.id || item.quantity >= 10}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-2 h-full text-stitch-secondary-text hover:text-stitch-primary disabled:opacity-40 transition-colors active:bg-stitch-surface-container"
                            aria-label="Increase quantity"
                          >
                            <MaterialIcon name="add" size="xs" />
                          </button>
                        </div>

                        {/* Line Price & Subtotal */}
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-black text-stitch-primary">
                            {formatCurrency(item.subtotal)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-[10px] text-stitch-secondary-text">
                              ({formatCurrency(item.unitPrice)} each)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Order Summary Card (Desktop) */}
            <div className="lg:col-span-4 bg-stitch-surface-container/60 border border-stitch-border p-5 sm:p-6 rounded-lg space-y-6 sticky top-28">
              <h3 className="text-xs font-black uppercase tracking-wider text-stitch-primary pb-3 border-b border-stitch-border">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-stitch-secondary-text">
                  <span>Bag Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})</span>
                  <span className="font-bold text-stitch-primary">
                    {formatCurrency(cart.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-stitch-secondary-text">
                  <span>Standard Delivery</span>
                  <span>
                    {cart.deliveryFee === 0 ? (
                      <strong className="text-stitch-accent font-bold uppercase">FREE</strong>
                    ) : (
                      formatCurrency(cart.deliveryFee)
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-stitch-border flex justify-between items-baseline">
                  <span className="text-sm font-black uppercase tracking-wide text-stitch-primary">
                    Total Amount
                  </span>
                  <span className="text-xl font-black text-stitch-primary">
                    {formatCurrency(cart.total)}
                  </span>
                </div>

                <p className="text-[11px] text-stitch-secondary-text text-right">
                  Inclusive of all taxes
                </p>
              </div>

              <Link href="/checkout" className="block">
                <Button variant="primary" size="lg" className="w-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <span>Proceed to Checkout</span>
                  <MaterialIcon name="arrow_forward" size="sm" />
                </Button>
              </Link>

              <div className="p-3.5 bg-white border border-stitch-border text-[11px] text-stitch-secondary-text rounded space-y-1.5">
                <div className="flex items-center gap-1.5 text-stitch-primary font-bold">
                  <MaterialIcon name="verified" size="xs" className="text-stitch-accent" />
                  <span>Secure & Verified Checkout</span>
                </div>
                <p>
                  Prices are recalculated and stock availability is verified server-side at checkout.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sticky Checkout Bar */}
        {!isCartEmpty && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stitch-border p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] lg:hidden pb-[calc(16px+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
              <div>
                <p className="text-[10px] uppercase font-bold text-stitch-secondary-text tracking-wider">Total Amount</p>
                <p className="text-base font-black text-stitch-primary">{formatCurrency(cart.total)}</p>
              </div>
              <Link href="/checkout" className="flex-1">
                <Button variant="primary" size="md" className="w-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <span>Checkout</span>
                  <MaterialIcon name="arrow_forward" size="xs" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
