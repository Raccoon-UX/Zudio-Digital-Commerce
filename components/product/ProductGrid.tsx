import React from "react";
import { ProductCardDTO } from "@/modules/products/types";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface ProductGridProps {
  products: ProductCardDTO[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onClearFilters?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  onClearFilters,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-2.5 border border-stitch-border p-2 bg-stitch-surface-base rounded-sm animate-pulse">
            <div className="aspect-[3/4] w-full bg-stitch-surface-container rounded-sm" />
            <div className="h-3 w-1/3 bg-stitch-surface-container rounded-sm" />
            <div className="h-4 w-3/4 bg-stitch-surface-container rounded-sm" />
            <div className="h-4 w-1/2 bg-stitch-surface-container rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || "No matching products found"}
        description={
          emptyDescription ||
          "We couldn't find any items matching your selected filters. Try broadening your criteria or resetting filters."
        }
        actionLabel={onClearFilters ? "Reset Filters" : undefined}
        onAction={onClearFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
};

export default ProductGrid;

