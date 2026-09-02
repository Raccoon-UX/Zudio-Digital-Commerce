"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
  CheckCircle2,
} from "lucide-react";

interface ProductDetailClientProps {
  initialProduct: ProductDetailDTO;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ initialProduct }) => {
  const router = useRouter();
  const [product] = useState<ProductDetailDTO>(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState<VariantDTO | null>(
    initialProduct.variants.length > 0 ? initialProduct.variants[0] : null
  );

  // Cart & Wishlist action states
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Modals
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isStoreAvailabilityOpen, setIsStoreAvailabilityOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    // Check existing wishlist state in the background without blocking render
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.data?.items) {
          const inWishlist = data.data.items.some(
            (item: any) =>
              item.product?.id === initialProduct.id ||
              item.product?.slug === initialProduct.slug ||
              item.productId === initialProduct.id
          );
          setIsWishlisted(inWishlist);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [initialProduct.id, initialProduct.slug]);

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
      alert("Unable to add item to bag. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    const previousState = isWishlisted;
    setIsWishlisted(!previousState);

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
        setIsWishlisted(previousState);
        router.push(`/login?callbackUrl=/products/${product.slug}`);
      } else {
        setIsWishlisted(previousState);
        alert(data.error?.message || "Failed to update wishlist.");
      }
    } catch (err) {
      console.error("Toggle wishlist error:", err);
      setIsWishlisted(previousState);
    }
  };

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

              {product.details && Object.keys(product.details).length > 0 && (
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-black mb-2">
                    Specifications
                  </h4>
                  <dl className="grid grid-cols-2 gap-2 bg-neutral-50 p-3 border border-neutral-200">
                    {Object.entries(product.details).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-neutral-400 uppercase text-[10px] font-bold">
                          {k}
                        </dt>
                        <dd className="font-semibold text-neutral-800 capitalize">
                          {String(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Pilot Service Badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200">
                  <Truck className="h-4 w-4 text-black shrink-0" />
                  <span className="text-[11px] font-medium text-neutral-700">
                    Home delivery in 2-4 days
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200">
                  <ShieldCheck className="h-4 w-4 text-black shrink-0" />
                  <span className="text-[11px] font-medium text-neutral-700">
                    100% Genuine Zudio styles
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Modals */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.categoryName}
      />

      {selectedVariant && (
        <StoreAvailabilityModal
          isOpen={isStoreAvailabilityOpen}
          onClose={() => setIsStoreAvailabilityOpen(false)}
          productId={product.id}
          variantId={selectedVariant.id}
          productName={product.name}
          sizeName={selectedVariant.sizeName}
          colorName={selectedVariant.colorName}
        />
      )}
    </div>
  );
};

export default ProductDetailClient;
