"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ProductCardDTO } from "@/modules/products/types";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: ProductCardDTO;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
  index?: number;
}

const FALLBACK_IMG = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";

export const ProductCard: React.FC<ProductCardProps> = ({ product, onWishlistToggle, isWishlisted = false, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [imgError, setImgError] = useState(false);

  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const alternateFirst = useMemo(() => index % 2 === 1 && !!product.secondaryImageUrl, [index, product.secondaryImageUrl]);
  const primaryDisplay = alternateFirst ? product.secondaryImageUrl || product.imageUrl : product.imageUrl;
  const hoverDisplay = alternateFirst ? product.imageUrl : product.secondaryImageUrl || product.imageUrl;
  const activeImage = imgError ? FALLBACK_IMG : (isHovered ? hoverDisplay : primaryDisplay);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
    onWishlistToggle?.(product.id);
  };

  return (
    <article
      className="group relative flex flex-col bg-stitch-surface-base border border-stitch-border hover:border-stitch-primary hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] rounded-sm transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="relative aspect-[3/4] w-full overflow-hidden bg-stitch-surface-container rounded-t-sm block">
        <Image
          src={activeImage}
          alt={product.name}
          fill
          sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          priority={index < 4}
          onError={() => setImgError(true)}
        />

        {/* Top Badges & Wishlist Button */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2 z-10">
          <div className="flex flex-col gap-1">
            {product.isNewArrival && (
              <span className="bg-stitch-accent text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm shadow-sm">
                NEW
              </span>
            )}
            {discountPercent && discountPercent > 0 && (
              <span className="bg-stitch-error text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleWishlistClick}
            className="p-1.5 bg-white/85 hover:bg-white backdrop-blur-sm text-stitch-primary hover:text-stitch-error shadow-sm rounded-full transition-transform hover:scale-110 active:scale-95"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <MaterialIcon
              name="favorite"
              size="sm"
              filled={wishlisted}
              className={wishlisted ? "text-stitch-error" : "text-stitch-secondary-text hover:text-stitch-error"}
            />
          </button>
        </div>

        {/* Hover Quick Size Preview */}
        <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm px-3 py-1.5 text-center text-[10px] uppercase font-bold tracking-wider text-stitch-primary opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block border-t border-stitch-border">
          {product.availableSizes.length > 0 ? `Sizes: ${product.availableSizes.join(" · ")}` : "View details"}
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1 gap-1.5 min-w-0">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stitch-secondary-text truncate">
            {product.categoryName}
          </p>
          <Link href={`/products/${product.slug}`} className="block mt-0.5">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-stitch-primary line-clamp-2 hover:underline leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto pt-2 border-t border-stitch-border/60 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-stitch-primary shrink-0">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[10px] sm:text-xs text-stitch-secondary-text line-through shrink-0">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          {product.availableColors.length > 0 && (
            <div className="flex items-center gap-1 shrink-0" aria-label={`${product.availableColors.length} colors available`}>
              {product.availableColors.slice(0, 3).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-2.5 w-2.5 rounded-full border border-stitch-border shadow-inner shrink-0"
                  style={{ backgroundColor: c.hexCode }}
                />
              ))}
              {product.availableColors.length > 3 && (
                <span className="text-[9px] text-stitch-secondary-text font-bold shrink-0">
                  +{product.availableColors.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
