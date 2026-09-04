"use client";

import React from "react";
import { VariantDTO } from "@/modules/products/types";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
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
    <div className="space-y-5">
      {/* Color Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider">
          <span className="font-bold text-stitch-primary">
            Color: <span className="font-semibold text-stitch-secondary-text">{selectedColorName}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
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
                aria-label={color.name}
                className={cn(
                  "h-8 w-8 rounded-full border flex items-center justify-center transition-all",
                  isSelected
                    ? "ring-2 ring-stitch-primary ring-offset-2 scale-105 border-white shadow-sm"
                    : "border-stitch-border hover:scale-105"
                )}
                style={{ backgroundColor: color.hexCode }}
              >
                {isSelected && (
                  <MaterialIcon
                    name="check"
                    size="xs"
                    className={
                      color.hexCode.toLowerCase() === "#ffffff" || color.hexCode.toLowerCase() === "#fff"
                        ? "text-stitch-primary"
                        : "text-white"
                    }
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
          <span className="font-bold text-stitch-primary">Select Size</span>
          {onOpenSizeGuide && (
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="text-stitch-secondary-text hover:text-stitch-primary underline normal-case font-semibold text-xs transition-colors"
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
                  "py-2.5 px-3 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors relative flex items-center justify-center min-h-[44px]",
                  isSelected
                    ? "bg-stitch-primary text-white border-stitch-primary shadow-sm"
                    : isAvailable
                    ? "bg-stitch-surface-base text-stitch-primary border-stitch-border hover:border-stitch-primary hover:bg-stitch-surface-container/30"
                    : "bg-stitch-surface-container/50 text-stitch-secondary-text/50 border-stitch-border/50 cursor-not-allowed line-through"
                )}
              >
                {size.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* SKU & Product Fit Summary */}
      {selectedVariant && (
        <div className="pt-1 text-[10px] text-stitch-secondary-text uppercase tracking-widest flex items-center justify-between">
          <span>SKU: {selectedVariant.sku}</span>
          <span className="text-stitch-accent font-semibold lowercase tracking-normal flex items-center gap-1">
            <MaterialIcon name="check" size="xs" /> standard fit
          </span>
        </div>
      )}
    </div>
  );
};

export default VariantSelector;

