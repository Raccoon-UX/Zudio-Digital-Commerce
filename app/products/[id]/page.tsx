"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { SizeGuideModal } from "@/components/product/SizeGuideModal";
import { StoreAvailabilityModal } from "@/components/product/StoreAvailabilityModal";
import { ProductDetailDTO, VariantDTO } from "@/modules/products/types";
import { formatCurrency } from "@/lib/utils";
import {
  Store,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productIdOrSlug = params.id as string;

  const [product, setProduct] = useState<ProductDetailDTO | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart & Wishlist action states
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Modals
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isStoreAvailabilityOpen, setIsStoreAvailabilityOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/products/${productIdOrSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.data) {
          setProduct(data.data);
          if (data.data.variants.length > 0) {
            setSelectedVariant(data.data.variants[0]);
          }
        } else {
          setError(data.error?.message || "Product not found.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Fetch product detail error:", err);
        setError("Unable to connect to product database.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productIdOrSlug]);

  const handleAddToCart = async (redirectToCheckout = false) => {
    if (!selectedVariant) return;
    setIsAddingToCart(true);

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAddedSuccess(true);
        setTimeout(() => setIsAddedSuccess(false), 3000);

        if (redirectToCheckout) {
          router.push("/checkout");
        }
      } else {
        alert(data.error?.message || "Failed to add product to cart.");
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (data.success) {
        setIsWishlisted(data.data.wishlisted);
      } else if (res.status === 401) {
        router.push(`/login?callbackUrl=/products/${product.slug}`);
      }
    } catch (err) {
      console.error("Toggle wishlist error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 bg-white min-h-screen">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <Skeleton className="aspect-[3/4] w-full" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-rose-50 border border-rose-200 inline-block rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-rose-600" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-2">
            Product Not Found
          </h2>
          <p className="text-xs text-neutral-500 mb-6 max-w-sm mx-auto">
            {error || "The requested product is unavailable or does not exist."}
          </p>
          <Link href="/products">
            <Button variant="primary" size="md">
              Back to Catalog
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.variants[0]?.price || 0;
  const currentCompareAtPrice = selectedVariant
    ? selectedVariant.compareAtPrice
    : product.variants[0]?.compareAtPrice;

  const discountPercent =
    currentCompareAtPrice && currentCompareAtPrice > currentPrice
      ? Math.round(
          ((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100
        )
      : null;

  return (
    <div className="py-8 md:py-12 bg-white min-h-screen">
      <Container size="xl">
        {/* Breadcrumb Navigation */}
        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-6">
          <Link href="/" className="hover:text-black">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/products" className="hover:text-black">
            Catalog
          </Link>{" "}
          /{" "}
          <Link
            href={`/categories/${product.categorySlug}`}
            className="hover:text-black"
          >
            {product.categoryName}
          </Link>{" "}
          / <span className="text-black font-semibold">{product.name}</span>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7">
            <ProductImageGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header / Category & Title */}
            <div className="space-y-1.5 border-b border-neutral-200 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  {product.categoryName}
                </span>
                {product.isNewArrival && (
                  <Badge variant="default" className="text-[10px]">
                    New Season
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-2xl font-black text-black">
                  {formatCurrency(currentPrice)}
                </span>
                {currentCompareAtPrice && currentCompareAtPrice > currentPrice && (
                  <span className="text-sm text-neutral-400 line-through">
                    {formatCurrency(currentCompareAtPrice)}
                  </span>
                )}
                {discountPercent && discountPercent > 0 && (
                  <Badge variant="danger" className="text-xs font-bold">
                    {discountPercent}% OFF
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider">
                Inclusive of all taxes
              </p>
            </div>

            {/* Interactive Variant Selection */}
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
              allSizes={product.allSizes}
              allColors={product.allColors}
              onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            />

            {/* In-Store Availability Trigger */}
            <div className="bg-neutral-50 border border-neutral-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-black" />
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    Physical Store Availability
                  </span>
                </div>
                <Badge variant="secondary" className="text-[9px]">
                  Pilot Feature
                </Badge>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Check stock for your size across our retail store network before you visit.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full bg-white border-neutral-300 hover:border-black text-xs"
                onClick={() => setIsStoreAvailabilityOpen(true)}
              >
                Check Demo Store Stock
              </Button>
            </div>

            {/* Customer Actions: Add to Cart & Wishlist */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isAddingToCart}
                  className="flex-1 text-sm tracking-wider"
                  onClick={() => handleAddToCart(false)}
                >
                  {isAddedSuccess ? (
                    <span className="flex items-center text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Added to Bag!
                    </span>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Add to Bag
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="p-3 border border-neutral-300 hover:border-black transition-colors"
                  aria-label="Save to Wishlist"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isWishlisted ? "fill-rose-600 text-rose-600" : "text-black"
                    }`}
                  />
                </button>
              </div>

              <Button
                variant="secondary"
                size="md"
                className="w-full text-xs font-bold"
                onClick={() => handleAddToCart(true)}
              >
                Buy Now
              </Button>
            </div>

            {/* Product Details & Specifications */}
            <div className="border-t border-neutral-200 pt-6 space-y-4 text-xs">
              <div>
                <h4 className="font-bold uppercase tracking-wider text-black mb-1">
                  Product Description
                </h4>
                <p className="text-neutral-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.details && (
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-black mb-1">
                    Fabric & Care
                  </h4>
                  <p className="text-neutral-600 leading-relaxed">
                    {product.details}
                  </p>
                </div>
              )}
            </div>

            {/* Brand Value Assurances */}
            <div className="grid grid-cols-3 gap-2 border-t border-neutral-200 pt-6 text-center text-[10px] text-neutral-500 uppercase tracking-wider">
              <div className="flex flex-col items-center gap-1">
                <Truck className="h-4 w-4 text-neutral-800" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Store className="h-4 w-4 text-neutral-800" />
                <span>Store Pickup</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-neutral-800" />
                <span>Genuine Quality</span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Modals */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />

      <StoreAvailabilityModal
        isOpen={isStoreAvailabilityOpen}
        onClose={() => setIsStoreAvailabilityOpen(false)}
        productId={product.id}
        variantId={selectedVariant?.id}
        productName={product.name}
        sizeName={selectedVariant?.sizeName}
        colorName={selectedVariant?.colorName}
      />
    </div>
  );
}
