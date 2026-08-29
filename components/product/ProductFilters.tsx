"use client";

import React, { useState } from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface FilterState {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  sort: "featured" | "newest" | "price_asc" | "price_desc";
}

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  categories?: { name: string; slug: string }[];
  totalProducts?: number;
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "UK 7", "UK 8", "UK 9", "UK 10"];
const AVAILABLE_COLORS = [
  { name: "Jet Black", hex: "#111111" },
  { name: "Crisp White", hex: "#FFFFFF" },
  { name: "Olive Green", hex: "#4B5320" },
  { name: "Navy Blue", hex: "#1B263B" },
  { name: "Heather Gray", hex: "#7D8285" },
  { name: "Rust Amber", hex: "#C05621" },
  { name: "Pastel Pink", hex: "#F4C2C2" },
];

const PRICE_RANGES = [
  { label: "All Prices", min: undefined, max: undefined },
  { label: "Under ₹499", min: 0, max: 499 },
  { label: "₹500 - ₹799", min: 500, max: 799 },
  { label: "₹800 - ₹1,199", min: 800, max: 1199 },
  { label: "₹1,200+", min: 1200, max: undefined },
];

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  categories = [
    { name: "All", slug: "all" },
    { name: "Men", slug: "men" },
    { name: "Women", slug: "women" },
    { name: "Kids", slug: "kids" },
    { name: "Footwear", slug: "footwear" },
  ],
  totalProducts,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeFilterCount =
    (filters.category && filters.category !== "all" ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length;

  const handleCategorySelect = (slug: string) => {
    onFilterChange({
      ...filters,
      category: slug === "all" ? undefined : slug,
    });
  };

  const handlePriceSelect = (min?: number, max?: number) => {
    onFilterChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
    });
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ ...filters, sizes: newSizes });
  };

  const handleColorToggle = (colorName: string) => {
    const newColors = filters.colors.includes(colorName)
      ? filters.colors.filter((c) => c !== colorName)
      : [...filters.colors, colorName];
    onFilterChange({ ...filters, colors: newColors });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sort: e.target.value as FilterState["sort"],
    });
  };

  const handleReset = () => {
    onFilterChange({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sizes: [],
      colors: [],
      sort: "featured",
    });
  };

  const filterContent = (
    <div className="space-y-6 text-xs uppercase tracking-wide">
      {/* Active count & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <span className="font-bold text-neutral-900">
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-black normal-case font-medium"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h4 className="font-bold text-black">Categories</h4>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isSelected =
              (!filters.category && cat.slug === "all") ||
              filters.category === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={cn(
                  "px-2.5 py-1 text-[11px] border transition-colors",
                  isSelected
                    ? "bg-black text-white border-black"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Ranges */}
      <div className="space-y-2">
        <h4 className="font-bold text-black">Price</h4>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isSelected =
              filters.minPrice === range.min && filters.maxPrice === range.max;
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => handlePriceSelect(range.min, range.max)}
                className={cn(
                  "block w-full text-left py-1 px-2 text-[11px] transition-colors",
                  isSelected
                    ? "font-bold text-black bg-neutral-100"
                    : "text-neutral-600 hover:text-black"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-2">
        <h4 className="font-bold text-black">Size</h4>
        <div className="grid grid-cols-4 gap-1">
          {AVAILABLE_SIZES.map((size) => {
            const isSelected = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeToggle(size)}
                className={cn(
                  "py-1.5 text-center text-[10px] font-bold border transition-colors",
                  isSelected
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-800 border-neutral-300 hover:border-black"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-2">
        <h4 className="font-bold text-black">Color</h4>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_COLORS.map((c) => {
            const isSelected = filters.colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => handleColorToggle(c.name)}
                title={c.name}
                className={cn(
                  "h-6 w-6 rounded-full border flex items-center justify-center transition-transform",
                  isSelected
                    ? "ring-2 ring-black scale-110 border-white"
                    : "border-neutral-300 hover:scale-105"
                )}
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      c.hex === "#FFFFFF" ? "bg-black" : "bg-white"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Top Bar on Mobile & Desktop: Count, Filter Trigger, Sort Dropdown */}
      <div className="flex items-center justify-between py-3 mb-4 border-b border-neutral-200 gap-4">
        {/* Mobile filter button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 border border-black text-xs font-bold uppercase"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-black text-white text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Product count */}
        <div className="text-xs text-neutral-500 uppercase tracking-wider">
          {totalProducts !== undefined ? (
            <span>
              Showing <strong className="text-black">{totalProducts}</strong> Items
            </span>
          ) : null}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-neutral-500 uppercase hidden sm:inline">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={filters.sort}
            onChange={handleSortChange}
            className="bg-white border border-neutral-300 text-xs font-semibold uppercase py-1.5 px-2 focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="newest">New Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 pr-6 border-r border-neutral-200">
        <div className="sticky top-28">{filterContent}</div>
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-6">
                <span className="text-sm font-black uppercase tracking-wider">
                  Filter Catalog
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 text-neutral-500 hover:text-black"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {filterContent}
            </div>

            <div className="pt-6 border-t border-neutral-200 mt-6">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => setIsMobileOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductFilters;
