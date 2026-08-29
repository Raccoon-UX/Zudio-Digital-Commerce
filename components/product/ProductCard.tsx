"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { ProductCardDTO } from "@/modules/products/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface ProductCardProps {
  product: ProductCardDTO;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onWishlistToggle,
  isWishlisted = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
        )
      : null;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
    if (onWishlistToggle) {
      onWishlistToggle(product.id);
    }
  };

  const displayImage =
    isHovered && product.secondaryImageUrl
      ? product.secondaryImageUrl
      : product.imageUrl;

  return (
    <div
      className="group relative flex flex-col bg-white border border-neutral-200 hover:border-black transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <Link href={`/products/${product.slug}`} className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 block">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.isNewArrival && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0.5 font-bold">
              New
            </Badge>
          )}
          {discountPercent && discountPercent > 0 && (
            <Badge variant="danger" className="text-[10px] px-1.5 py-0.5 font-bold">
              {discountPercent}% OFF
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-none text-neutral-700 hover:text-black transition-colors shadow-sm"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 ${
              wishlisted ? "fill-rose-600 text-rose-600" : ""
            }`}
          />
        </button>

        {/* Size Pills on Hover (Desktop) */}
        {product.availableSizes.length > 0 && (
          <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm px-2 py-1.5 text-center text-[10px] uppercase font-semibold tracking-wider text-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block border-t border-neutral-200">
            Sizes: {product.availableSizes.join(" · ")}
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {product.categoryName}
          </p>
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-900 line-clamp-1 hover:underline mt-0.5">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Colors and Price */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-black">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-neutral-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Color Dots */}
          {product.availableColors.length > 0 && (
            <div className="flex items-center space-x-1">
              {product.availableColors.slice(0, 4).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-2.5 w-2.5 rounded-full border border-neutral-300 shadow-inner"
                  style={{ backgroundColor: c.hexCode }}
                />
              ))}
              {product.availableColors.length > 4 && (
                <span className="text-[9px] text-neutral-400 font-medium">
                  +{product.availableColors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
