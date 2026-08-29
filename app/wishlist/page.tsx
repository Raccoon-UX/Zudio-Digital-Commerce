"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { WishlistDTO } from "@/modules/wishlist/types";

export default function WishlistPage() {
  const { data: session, status } = useSession();

  const [wishlist, setWishlist] = useState<WishlistDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wishlist");
      const data = await res.json();
      if (data.success) {
        setWishlist(data.data);
      } else {
        setError(data.error?.message || "Failed to load wishlist.");
      }
    } catch (err) {
      console.error("Wishlist fetch error:", err);
      setError("Unable to connect to wishlist service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [status]);

  const handleRemoveItem = async (productId: string) => {
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchWishlist();
      }
    } catch (err) {
      console.error("Remove wishlist item error:", err);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-neutral-100 border border-neutral-200 inline-block rounded-full mb-4">
            <Heart className="h-8 w-8 text-neutral-600" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-2">
            Please Sign In
          </h2>
          <p className="text-xs text-neutral-500 mb-6 max-w-sm mx-auto">
            Sign in to your account to view your saved wishlist items across all your devices.
          </p>
          <Link href="/login?callbackUrl=/wishlist">
            <Button variant="primary" size="md">
              Sign In to Wishlist
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 bg-white min-h-screen">
      <Container size="xl">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-6 mb-8 flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              <span>Home</span> / <span className="text-black">Wishlist</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
              My Wishlist {wishlist?.count ? `(${wishlist.count})` : ""}
            </h1>
          </div>
          <Link href="/products">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-neutral-200 p-2 space-y-2">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : !wishlist || wishlist.items.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            description="Explore our collections and save your favorite styles to review or purchase later."
            icon={Heart}
            actionLabel="Explore Collections"
            onAction={() => (window.location.href = "/products")}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlist.items.map((item) => {
              const p = item.product;
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col bg-white border border-neutral-200 hover:border-black transition-colors"
                >
                  {/* Image container */}
                  <Link
                    href={`/products/${p.slug}`}
                    className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 block"
                  >
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveItem(p.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm text-neutral-500 hover:text-rose-600 shadow-sm"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Link>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {p.categoryName}
                      </p>
                      <Link href={`/products/${p.slug}`}>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-900 line-clamp-1 hover:underline">
                          {p.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <span className="text-sm font-black text-black">
                        {formatCurrency(p.price)}
                      </span>

                      <Link href={`/products/${p.slug}`}>
                        <Button variant="primary" size="sm" className="text-[10px] py-1 px-2.5">
                          View Style
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
