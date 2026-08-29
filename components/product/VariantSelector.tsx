"use client";

import React from "react";
import { VariantDTO } from "@/modules/products/types";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  variants: VariantDTO[];
  selectedVariant: VariantDTO | null;
  onVariantChange: (variant: VariantDTO) => void;
  allSizes: { id: string; name: string; sortOrder: number }[];
  allColors: { id: string; name: string; hexCode: string }[];
  onOpenSizeGuide?: () => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariant,
  onVariantChange,
  allSizes,
  allColors,
  onOpenSizeGuide,
}) => {
  const selectedColorName = selectedVariant?.colorName || allColors[0]?.name;
  const selectedSizeName = selectedVariant?.sizeName || allSizes[0]?.name;

  // Handle color change: pick matching variant for selected color + current size (or first available size)
  const handleColorSelect = (colorName: string) => {
    const matchingVariant =
      variants.find(
        (v) => v.colorName === colorName && v.sizeName === selectedSizeName
      ) || variants.find((v) => v.colorName === colorName);

    if (matchingVariant) {
      onVariantChange(matchingVariant);
    }
  };

  // Handle size change: pick matching variant for current color + selected size
  const handleSizeSelect = (sizeName: string) => {
    const matchingVariant = variants.find(
      (v) => v.colorName === selectedColorName && v.sizeName === sizeName
    );

    if (matchingVariant) {
      onVariantChange(matchingVariant);
    }
  };

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider">
          <span className="font-bold text-neutral-900">Color:</span>
          <span className="font-semibold text-neutral-600">
            {selectedColorName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {allColors.map((color) => {
            const isSelected = selectedColorName === color.name;
            const isAvailableForColor = variants.some(
              (v) => v.colorName === color.name
            );

            if (!isAvailableForColor) return null;

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => handleColorSelect(color.name)}
                title={color.name}
                className={cn(
                  "h-8 w-8 rounded-full border flex items-center justify-center transition-all",
                  isSelected
                    ? "ring-2 ring-black ring-offset-2 scale-105 border-neutral-400"
                    : "border-neutral-300 hover:scale-105"
                )}
                style={{ backgroundColor: color.hexCode }}
              >
                {isSelected && (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      color.hexCode.toLowerCase() === "#ffffff"
                        ? "bg-black"
                        : "bg-white"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider">
          <span className="font-bold text-neutral-900">Select Size</span>
          {onOpenSizeGuide && (
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="text-neutral-500 hover:text-black underline normal-case font-medium text-[11px]"
            >
              Size Guide
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {allSizes.map((size) => {
            const isSelected = selectedSizeName === size.name;
            const variantForSize = variants.find(
              (v) => v.colorName === selectedColorName && v.sizeName === size.name
            );
            const isAvailable = Boolean(variantForSize);

            return (
              <button
                key={size.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => handleSizeSelect(size.name)}
                className={cn(
                  "py-2.5 px-3 text-xs font-bold uppercase tracking-wider border transition-colors relative",
                  isSelected
                    ? "bg-black text-white border-black"
                    : isAvailable
                    ? "bg-white text-black border-neutral-300 hover:border-black"
                    : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through"
                )}
              >
                {size.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* SKU & Product Specifications Summary */}
      {selectedVariant && (
        <div className="pt-2 text-[11px] text-neutral-400 uppercase tracking-widest flex items-center justify-between">
          <span>SKU: {selectedVariant.sku}</span>
          <span className="text-emerald-700 font-semibold lowercase tracking-normal">
            ✓ standard fit
          </span>
        </div>
      )}
    </div>
  );
};

export default VariantSelector;
