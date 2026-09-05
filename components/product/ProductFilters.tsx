"use client";

import React, { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
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
  children?: React.ReactNode;
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

const SORT_OPTIONS: { label: string; value: FilterState["sort"] }[] = [
  { label: "Featured", value: "featured" },
  { label: "New Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
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
  children,
}) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

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

  const handleSortChange = (sortValue: FilterState["sort"]) => {
    onFilterChange({
      ...filters,
      sort: sortValue,
    });
    setIsSortModalOpen(false);
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
      <div className="flex items-center justify-between pb-3 border-b border-stitch-border">
        <span className="font-bold text-stitch-primary">
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-stitch-secondary-text hover:text-stitch-primary normal-case font-semibold transition-colors"
          >
            <MaterialIcon name="refresh" size="xs" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2.5">
        <h4 className="font-bold text-stitch-primary tracking-wider">Category</h4>
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
                  "px-3 py-1.5 text-[11px] font-semibold tracking-wide rounded-sm border transition-colors",
                  isSelected
                    ? "bg-stitch-primary text-white border-stitch-primary"
                    : "bg-stitch-surface-container/50 text-stitch-primary border-stitch-border hover:border-stitch-primary"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Ranges */}
      <div className="space-y-2.5">
        <h4 className="font-bold text-stitch-primary tracking-wider">Price</h4>
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
                  "flex items-center justify-between w-full text-left py-1.5 px-2.5 rounded-sm text-[11px] transition-colors",
                  isSelected
                    ? "font-bold text-stitch-primary bg-stitch-surface-container"
                    : "text-stitch-secondary-text hover:text-stitch-primary hover:bg-stitch-surface-container/40"
                )}
              >
                <span>{range.label}</span>
                {isSelected && <MaterialIcon name="check" size="xs" className="text-stitch-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-2.5">
        <h4 className="font-bold text-stitch-primary tracking-wider">Size</h4>
        <div className="grid grid-cols-4 gap-1.5">
          {AVAILABLE_SIZES.map((size) => {
            const isSelected = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeToggle(size)}
                className={cn(
                  "py-2 text-center text-[10px] font-bold rounded-sm border transition-colors",
                  isSelected
                    ? "bg-stitch-primary text-white border-stitch-primary"
                    : "bg-stitch-surface-base text-stitch-primary border-stitch-border hover:border-stitch-primary"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-2.5">
        <h4 className="font-bold text-stitch-primary tracking-wider">Color</h4>
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
                  "h-7 w-7 rounded-full border flex items-center justify-center transition-transform",
                  isSelected
                    ? "ring-2 ring-stitch-primary scale-110 border-white"
                    : "border-stitch-border hover:scale-105"
                )}
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <MaterialIcon
                    name="check"
                    size="xs"
                    className={c.hex === "#FFFFFF" ? "text-stitch-primary" : "text-white"}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const desktopToolbar = (
    <div className="hidden lg:flex items-center justify-between pb-3 mb-6 border-b border-stitch-border gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-stitch-secondary-text">
          {totalProducts !== undefined ? (
            <>Showing <strong className="text-stitch-primary font-bold">{totalProducts}</strong> Products</>
          ) : null}
        </span>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.category && filters.category !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stitch-surface-container text-[10px] font-bold uppercase tracking-wider text-stitch-primary rounded-sm">
                {filters.category}
                <button type="button" onClick={() => handleCategorySelect("all")} className="hover:text-stitch-error">
                  <MaterialIcon name="close" size="xs" />
                </button>
              </span>
            )}
            {filters.sizes.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-stitch-surface-container text-[10px] font-bold uppercase tracking-wider text-stitch-primary rounded-sm">
                Size: {s}
                <button type="button" onClick={() => handleSizeToggle(s)} className="hover:text-stitch-error">
                  <MaterialIcon name="close" size="xs" />
                </button>
              </span>
            ))}
            {filters.colors.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-stitch-surface-container text-[10px] font-bold uppercase tracking-wider text-stitch-primary rounded-sm">
                {c}
                <button type="button" onClick={() => handleColorToggle(c)} className="hover:text-stitch-error">
                  <MaterialIcon name="close" size="xs" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] font-bold text-stitch-secondary-text hover:text-stitch-primary uppercase underline ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Desktop Sort Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <label htmlFor="desktop-sort-select" className="text-xs font-semibold uppercase tracking-wider text-stitch-secondary-text">
          Sort by:
        </label>
        <div className="relative">
          <select
            id="desktop-sort-select"
            value={filters.sort}
            onChange={(e) => handleSortChange(e.target.value as FilterState["sort"])}
            className="appearance-none bg-stitch-surface-base border border-stitch-border text-xs font-bold uppercase tracking-wider py-1.5 pl-3 pr-8 rounded-sm text-stitch-primary focus:outline-none focus:border-stitch-primary cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <MaterialIcon
            name="sort"
            size="xs"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-stitch-secondary-text pointer-events-none"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* 1. Mobile Sticky Filter/Sort Bar (Exact Stitch PLP layout) */}
      <div className="lg:hidden sticky top-16 z-30 bg-stitch-surface-base border-y border-stitch-border flex items-center mb-4">
        <button
          type="button"
          onClick={() => setIsSortModalOpen(true)}
          className="flex-1 py-3 flex items-center justify-center gap-2 text-stitch-primary font-bold text-xs uppercase tracking-wider border-r border-stitch-border hover:bg-stitch-surface-container/30 active:bg-stitch-surface-container transition-colors"
        >
          <MaterialIcon name="sort" size="sm" />
          <span>Sort</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          className="flex-1 py-3 flex items-center justify-center gap-2 text-stitch-primary font-bold text-xs uppercase tracking-wider hover:bg-stitch-surface-container/30 active:bg-stitch-surface-container transition-colors"
        >
          <MaterialIcon name="tune" size="sm" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-stitch-accent text-white text-[9px] font-bold rounded-full leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Main 2-Column Desktop Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sticky Sidebar (Desktop only) */}
        <aside className="hidden lg:block w-60 xl:w-64 shrink-0 pr-6 border-r border-stitch-border">
          <div className="sticky top-24">{filterContent}</div>
        </aside>

        {/* Right Content Area (Product Grid + Top Toolbar) */}
        <div className="flex-1 min-w-0">
          {desktopToolbar}
          {children}
        </div>
      </div>

      {/* 4. Mobile Slide-over Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-stitch-surface-base h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stitch-border mb-6">
                <span className="text-sm font-black uppercase tracking-wider text-stitch-primary">
                  Filter Products
                </span>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-1 text-stitch-secondary-text hover:text-stitch-primary transition-colors"
                >
                  <MaterialIcon name="close" size="sm" />
                </button>
              </div>

              {filterContent}
            </div>

            <div className="pt-6 border-t border-stitch-border mt-6 flex gap-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1 text-xs"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 text-xs"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Mobile Sort Bottom Sheet */}
      {isSortModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSortModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-stitch-surface-base rounded-t-lg sm:rounded-lg p-6 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stitch-border mb-4">
              <span className="text-sm font-black uppercase tracking-wider text-stitch-primary">
                Sort By
              </span>
              <button
                type="button"
                onClick={() => setIsSortModalOpen(false)}
                className="p-1 text-stitch-secondary-text hover:text-stitch-primary"
              >
                <MaterialIcon name="close" size="sm" />
              </button>
            </div>

            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = filters.sort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSortChange(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded text-xs font-bold uppercase tracking-wider transition-colors",
                      isSelected
                        ? "bg-stitch-surface-container text-stitch-primary"
                        : "text-stitch-secondary-text hover:text-stitch-primary hover:bg-stitch-surface-container/40"
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <MaterialIcon name="check" size="sm" className="text-stitch-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;

