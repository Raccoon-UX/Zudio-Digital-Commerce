"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductImageDTO } from "@/modules/products/types";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: ProductImageDTO[];
  productName: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  productName,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const activeImage = images[selectedIdx] || images[0] || {
    url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    altText: productName,
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnail Bar */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 shrink-0">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={cn(
                "relative aspect-[3/4] w-16 md:w-20 overflow-hidden border transition-all shrink-0",
                selectedIdx === idx
                  ? "border-black ring-1 ring-black"
                  : "border-neutral-200 opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={img.altText || `${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main High-Res Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-neutral-200">
        <Image
          src={activeImage.url}
          alt={activeImage.altText || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center"
        />
      </div>
    </div>
  );
};

export default ProductImageGallery;
