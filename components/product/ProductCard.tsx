"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ChevronRight } from "lucide-react";
import { ProductCardDTO } from "@/modules/products/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface ProductCardProps {
  product: ProductCardDTO;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onWishlistToggle, isWishlisted = false, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  // The dataset currently contains two curated images per clothing type. Alternate the
  // initial frame so a catalog page does not look like the exact same tile repeated.
  const alternateFirst = useMemo(() => index % 2 === 1 && !!product.secondaryImageUrl, [index, product.secondaryImageUrl]);
  const primaryDisplay = alternateFirst ? product.secondaryImageUrl || product.imageUrl : product.imageUrl;
  const hoverDisplay = alternateFirst ? product.imageUrl : product.secondaryImageUrl || product.imageUrl;
  const displayImage = isHovered ? hoverDisplay : primaryDisplay;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
    onWishlistToggle?.(product.id);
  };

  return (
    <article className="group relative flex flex-col bg-white border border-neutral-200 hover:border-black hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
      <Link href={`/products/${product.slug}`} className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 block">
        <Image src={displayImage} alt={product.name} fill sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.035]" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5 z-10">
          <div className="flex flex-col gap-1">
            {product.isNewArrival && <Badge variant="default" className="text-[9px] px-2 py-1 font-bold uppercase tracking-wider shadow-sm">New</Badge>}
            {discountPercent && discountPercent > 0 && <Badge variant="danger" className="text-[9px] px-2 py-1 font-bold shadow-sm">{discountPercent}% OFF</Badge>}
          </div>
          <button type="button" onClick={handleWishlistClick} className="p-2 bg-white/95 backdrop-blur-sm text-neutral-700 hover:text-black shadow-sm rounded-full transition-transform hover:scale-105" aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-rose-600 text-rose-600" : ""}`} />
          </button>
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm px-3 py-2 text-center text-[10px] uppercase font-bold tracking-wider text-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block border-t border-neutral-200">
          {product.availableSizes.length > 0 ? `Sizes: ${product.availableSizes.join(" · ")}` : "View product details"}
        </div>
      </Link>

      <div className="p-3.5 flex flex-col gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">{product.categoryName}</p>
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-neutral-900 line-clamp-2 hover:underline mt-1 min-h-[30px]">{product.name}</h3>
          </Link>
        </div>

        <div className="flex items-end justify-between gap-2 pt-2 border-t border-neutral-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-black">{formatCurrency(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && <span className="text-[11px] text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>}
            </div>
            <p className="text-[9px] text-neutral-500 mt-1 uppercase tracking-wide">Inclusive of all taxes</p>
          </div>
          {product.availableColors.length > 0 && (
            <div className="flex items-center gap-1 pb-0.5" aria-label={`${product.availableColors.length} colours available`}>
              {product.availableColors.slice(0, 4).map((c) => <span key={c.name} title={c.name} className="h-3 w-3 rounded-full border border-neutral-300 shadow-inner" style={{ backgroundColor: c.hexCode }} />)}
              {product.availableColors.length > 4 && <span className="text-[9px] text-neutral-400">+{product.availableColors.length - 4}</span>}
            </div>
          )}
        </div>

        <Link href={`/products/${product.slug}`} className="mt-0.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.13em] text-neutral-600 hover:text-black">
          <span>{product.availableColors.length} colours · {product.availableSizes.length} sizes</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
};

export default ProductCard;
