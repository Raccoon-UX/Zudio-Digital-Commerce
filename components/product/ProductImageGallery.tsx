"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductImageDTO } from "@/modules/products/types";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
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

  const displayImages = images.length > 0 ? images : [
    {
      id: "img-fallback",
      url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      altText: productName,
      isPrimary: true,
      sortOrder: 0,
    }
  ];

  const activeImage = displayImages[selectedIdx] || displayImages[0];

  const handlePrev = () => {
    setSelectedIdx((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIdx((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-3 sm:gap-4">
      {/* Desktop & Mobile Thumbnail Bar */}
      {displayImages.length > 1 && (
        <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto pb-1 md:pb-0 shrink-0 scrollbar-none">
          {displayImages.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={cn(
                "relative aspect-[3/4] w-14 sm:w-16 md:w-20 overflow-hidden rounded-sm border transition-all shrink-0 bg-stitch-surface-container",
                selectedIdx === idx
                  ? "border-stitch-primary ring-1 ring-stitch-primary opacity-100"
                  : "border-stitch-border opacity-70 hover:opacity-100"
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

      {/* Main High-Res Image Viewport */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-stitch-surface-container border border-stitch-border group">
        <Image
          src={activeImage.url}
          alt={activeImage.altText || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Carousel Navigation Arrows (if multiple images) */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-stitch-primary rounded-full shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
              aria-label="Previous Image"
            >
              <MaterialIcon name="chevron_left" size="sm" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-stitch-primary rounded-full shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
              aria-label="Next Image"
            >
              <MaterialIcon name="chevron_right" size="sm" />
            </button>

            {/* Mobile / Visual Dot Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-full bg-black/40 backdrop-blur-sm">
              {displayImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    selectedIdx === i ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductImageGallery;

