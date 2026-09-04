"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { SizeGuideModal } from "@/components/product/SizeGuideModal";
import { StoreAvailabilityModal } from "@/components/product/StoreAvailabilityModal";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailDTO, VariantDTO, ProductCardDTO } from "@/modules/products/types";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailClientProps {
  initialProduct: ProductDetailDTO;
  relatedProducts?: ProductCardDTO[];
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  initialProduct,
  relatedProducts = [],
}) => {
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
    <div className="py-6 sm:py-8 md:py-10 bg-stitch-surface-base min-h-screen text-stitch-primary">
      <Container size="xl">
        {/* 1. Stitch Breadcrumb Navigation */}
        <nav className="mb-4 sm:mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-stitch-secondary-text">
            <li>
              <Link href="/" className="hover:text-stitch-primary transition-colors">
                Home
              </Link>
            </li>
            <li>
              <MaterialIcon name="chevron_right" size="xs" className="text-stitch-secondary-text/60" />
            </li>
            <li>
              <Link href="/products" className="hover:text-stitch-primary transition-colors">
                Catalog
              </Link>
            </li>
            <li>
              <MaterialIcon name="chevron_right" size="xs" className="text-stitch-secondary-text/60" />
            </li>
            <li>
              <Link
                href={`/categories/${product.categorySlug}`}
                className="hover:text-stitch-primary transition-colors"
              >
                {product.categoryName}
              </Link>
            </li>
            <li>
              <MaterialIcon name="chevron_right" size="xs" className="text-stitch-secondary-text/60" />
            </li>
            <li className="text-stitch-primary font-bold truncate max-w-[180px] sm:max-w-none">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* 2. Main Product Layout (Gallery on Left, Buy Box on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7">
            <ProductImageGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Right Column: Product Details, Variant Selection & Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header / Category & Title */}
            <div className="space-y-2 border-b border-stitch-border pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-stitch-secondary-text">
                  {product.categoryName}
                </span>
                {product.isNewArrival && (
                  <span className="bg-stitch-accent text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm">
                    New Season
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-stitch-primary">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl sm:text-3xl font-bold text-stitch-primary">
                  {formatCurrency(currentPrice)}
                </span>
                {currentCompareAtPrice && currentCompareAtPrice > currentPrice && (
                  <span className="text-sm text-stitch-secondary-text line-through">
                    {formatCurrency(currentCompareAtPrice)}
                  </span>
                )}
                {discountPercent && discountPercent > 0 && (
                  <span className="bg-stitch-error text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stitch-secondary-text uppercase tracking-wider">
                MRP inclusive of all taxes
              </p>

              {/* Rating & Review Pill */}
              <div className="flex items-center gap-1 pt-1">
                <div className="flex text-stitch-primary">
                  <MaterialIcon name="star" size="xs" filled className="text-stitch-primary" />
                  <MaterialIcon name="star" size="xs" filled className="text-stitch-primary" />
                  <MaterialIcon name="star" size="xs" filled className="text-stitch-primary" />
                  <MaterialIcon name="star" size="xs" filled className="text-stitch-primary" />
                  <MaterialIcon name="star_half" size="xs" filled className="text-stitch-primary" />
                </div>
                <span className="text-xs text-stitch-secondary-text font-semibold ml-1">
                  (124 Reviews)
                </span>
              </div>
            </div>

            {/* Interactive Variant Selection (Colors & Sizes) */}
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
              allSizes={product.allSizes}
              allColors={product.allColors}
              onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            />

            {/* Customer Actions: Add to Bag, Buy Now, & Wishlist */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isAddingToCart}
                  className="flex-1 text-xs sm:text-sm font-bold uppercase tracking-wider h-12"
                  onClick={() => handleAddToCart(false)}
                >
                  {isAddedSuccess ? (
                    <span className="flex items-center text-emerald-400">
                      <MaterialIcon name="check_circle" size="sm" className="mr-1.5" />
                      Added to Bag!
                    </span>
                  ) : (
                    <>
                      <MaterialIcon name="shopping_bag" size="sm" className="mr-1.5" />
                      Add to Bag
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="h-12 w-12 border border-stitch-border hover:border-stitch-primary flex items-center justify-center rounded-sm transition-colors text-stitch-primary"
                  aria-label={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                >
                  <MaterialIcon
                    name="favorite"
                    size="md"
                    filled={isWishlisted}
                    className={isWishlisted ? "text-stitch-error" : "text-stitch-secondary-text hover:text-stitch-error"}
                  />
                </button>
              </div>

              <Button
                variant="outline"
                size="md"
                className="w-full text-xs font-bold uppercase tracking-wider h-11 border-stitch-primary text-stitch-primary hover:bg-stitch-surface-container"
                onClick={() => handleAddToCart(true)}
              >
                Buy Now
              </Button>
            </div>

            {/* Quick Delivery Info Banner */}
            <div className="flex items-center gap-3 p-3.5 bg-stitch-surface-container/40 border border-stitch-border rounded-sm">
              <MaterialIcon name="local_shipping" size="md" className="text-stitch-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-stitch-primary uppercase tracking-wide">
                  Free Standard Delivery
                </p>
                <p className="text-[11px] text-stitch-secondary-text leading-tight mt-0.5">
                  Estimated delivery within 2-4 working days.
                </p>
              </div>
            </div>

            {/* In-Store Availability Card */}
            <div className="bg-stitch-surface-container/50 border border-stitch-border p-4 rounded-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MaterialIcon name="storefront" size="sm" className="text-stitch-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stitch-primary">
                    Physical Store Availability
                  </span>
                </div>
                <Badge variant="accent" className="text-[9px]">
                  Pilot Feature
                </Badge>
              </div>
              <p className="text-xs text-stitch-secondary-text leading-relaxed">
                Check stock for your size across our retail store network before visiting, or place a 2-hour hold reservation.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full bg-stitch-surface-base border-stitch-border hover:border-stitch-primary text-xs font-bold uppercase tracking-wider"
                onClick={() => setIsStoreAvailabilityOpen(true)}
              >
                <MaterialIcon name="location_on" size="xs" className="mr-1.5" />
                Check Store Stock & Hold
              </Button>
            </div>

            {/* 3. Product Accordions (Description, Fabric & Care, Delivery & Returns) */}
            <div className="border-t border-stitch-border pt-4">
              <Accordion type="single" collapsible defaultValue="desc">
                {/* Description */}
                <AccordionItem value="desc">
                  <AccordionTrigger>Product Description</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-xs text-stitch-secondary-text leading-relaxed">
                      <p>{product.description}</p>
                      {product.details && Object.keys(product.details).length > 0 && (
                        <div className="pt-2">
                          <p className="font-bold text-stitch-primary uppercase tracking-wider mb-1.5">
                            Specifications:
                          </p>
                          <dl className="grid grid-cols-2 gap-2 bg-stitch-surface-container/40 p-2.5 rounded-sm border border-stitch-border">
                            {Object.entries(product.details).map(([k, v]) => (
                              <div key={k}>
                                <dt className="text-stitch-secondary-text uppercase text-[9px] font-bold">
                                  {k}
                                </dt>
                                <dd className="font-semibold text-stitch-primary capitalize text-xs">
                                  {String(v)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Fabric & Care */}
                <AccordionItem value="care">
                  <AccordionTrigger>Fabric &amp; Care</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-xs text-stitch-secondary-text leading-relaxed">
                      <p>
                        <strong className="text-stitch-primary">Composition:</strong> Premium breathable cotton blend with high stretch comfort.
                      </p>
                      <p>
                        <strong className="text-stitch-primary">Care Instructions:</strong> Machine wash cold with similar colors. Do not bleach. Tumble dry low. Warm iron if needed.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Delivery & Returns */}
                <AccordionItem value="returns">
                  <AccordionTrigger>Delivery &amp; Returns</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-xs text-stitch-secondary-text leading-relaxed">
                      <p>
                        Standard doorstep shipping across India. Free shipping on all prepaid orders.
                      </p>
                      <p>
                        Easy 15-day return and exchange policy for unworn items with original tags intact.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* 4. You May Also Like (Related Products Section) */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-20 pt-12 border-t border-stitch-border">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stitch-secondary-text">
                  Recommendations
                </p>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-stitch-primary mt-0.5">
                  You May Also Like
                </h2>
              </div>
              <Link
                href={`/categories/${product.categorySlug}`}
                className="text-xs font-bold uppercase tracking-wider text-stitch-primary hover:text-stitch-accent inline-flex items-center gap-1"
              >
                <span>View More</span>
                <MaterialIcon name="chevron_right" size="xs" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map((relProduct, idx) => (
                <ProductCard key={relProduct.id} product={relProduct} index={idx} />
              ))}
            </div>
          </section>
        )}
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
          imageUrl={product.images?.[0]?.url}
          styleCode={selectedVariant.sku}
          price={selectedVariant.price}
        />
      )}
    </div>
  );
};

export default ProductDetailClient;

