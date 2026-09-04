"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters, FilterState } from "@/components/product/ProductFilters";
import { ProductCardDTO } from "@/modules/products/types";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = (params.category as string)?.toLowerCase() || "men";

  const [products, setProducts] = useState<ProductCardDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    category: categorySlug,
    minPrice: undefined,
    maxPrice: undefined,
    sizes: [],
    colors: [],
    sort: "featured",
  });

  const categoryTitles: Record<string, { title: string; subtitle: string; bgImage: string }> = {
    men: {
      title: "Men's Collection",
      subtitle: "Contemporary everyday tees, shirts, denims, and jackets crafted for daily comfort",
      bgImage: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1400&auto=format&fit=crop&q=85",
    },
    women: {
      title: "Women's Collection",
      subtitle: "Trending dresses, tops, ethnic kurtas, and denims styled for everyday fashion",
      bgImage: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1400&auto=format&fit=crop&q=85",
    },
    kids: {
      title: "Kids' Collection",
      subtitle: "Playful, durable clothing sets, graphic tees, and jackets for boys and girls",
      bgImage: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1400&auto=format&fit=crop&q=85",
    },
    footwear: {
      title: "Footwear & Sneakers",
      subtitle: "Everyday sneakers, sliders, loafers, and flats offering exceptional value and style",
      bgImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1400&auto=format&fit=crop&q=85",
    },
  };

  const currentMeta = categoryTitles[categorySlug] || {
    title: `${categorySlug.toUpperCase()} Collection`,
    subtitle: "Everyday fashion curated for you.",
    bgImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1400&auto=format&fit=crop&q=85",
  };

  const fetchCategoryProducts = useCallback(
    async (currentFilters: FilterState, currentPage: number) => {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      // Strictly enforce category query parameter
      queryParams.set("category", categorySlug);

      if (currentFilters.minPrice !== undefined) queryParams.set("minPrice", currentFilters.minPrice.toString());
      if (currentFilters.maxPrice !== undefined) queryParams.set("maxPrice", currentFilters.maxPrice.toString());
      if (currentFilters.sizes.length > 0) queryParams.set("sizes", currentFilters.sizes.join(","));
      if (currentFilters.colors.length > 0) queryParams.set("colors", currentFilters.colors.join(","));
      if (currentFilters.sort) queryParams.set("sort", currentFilters.sort);
      queryParams.set("page", currentPage.toString());
      queryParams.set("limit", "12");

      try {
        const res = await fetch(`/api/products?${queryParams.toString()}`);
        const data = await res.json();

        if (data.success) {
          setProducts(data.data);
          setTotal(data.meta?.total || 0);
          setTotalPages(data.meta?.totalPages || 1);
        } else {
          setError(data.error?.message || "Failed to load category products.");
        }
      } catch (err) {
        console.error("Error fetching category products:", err);
        setError("Unable to connect to product catalog database.");
      } finally {
        setIsLoading(false);
      }
    },
    [categorySlug]
  );

  useEffect(() => {
    fetchCategoryProducts(filters, page);
  }, [filters, page, fetchCategoryProducts]);

  const handleFilterChange = (newFilters: FilterState) => {
    // Keep category locked to the current route
    setFilters({ ...newFilters, category: categorySlug });
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="py-6 sm:py-8 bg-stitch-surface-base min-h-screen text-stitch-primary">
      <Container size="xl">
        {/* 1. Stitch Category Breadcrumb */}
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-stitch-secondary-text">
            <li>
              <Link href="/" className="hover:text-stitch-primary transition-colors">
                Home
              </Link>
            </li>
            <li>
              <MaterialIcon name="chevron_right" size="xs" className="text-stitch-secondary-text/60" />
            </li>
            <li>
              <Link href="/products" className="hover:text-stitch-primary transition-colors">
                Categories
              </Link>
            </li>
            <li>
              <MaterialIcon name="chevron_right" size="xs" className="text-stitch-secondary-text/60" />
            </li>
            <li className="text-stitch-primary font-bold">{currentMeta.title}</li>
          </ol>
        </nav>

        {/* 2. Category Hero Editorial Banner */}
        <div className="relative overflow-hidden bg-neutral-950 text-white p-6 sm:p-12 mb-8 rounded-sm border border-neutral-800 shadow-md">
          <div className="absolute inset-0 z-0">
            <img
              src={currentMeta.bgImage}
              alt={currentMeta.title}
              className="h-full w-full object-cover object-center opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/35" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-sm">
              {currentMeta.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-200 mt-2 font-normal leading-relaxed drop-shadow max-w-lg">
              {currentMeta.subtitle}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-stitch-accent mt-3">
              {total} Products Found
            </p>
          </div>
        </div>

        {/* 3. Main Grid + Filter Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            totalProducts={total}
          />

          <div className="flex-1">
            {error ? (
              <div className="p-6 bg-stitch-surface-container border border-stitch-error/30 text-stitch-error text-xs flex items-center gap-3 rounded-sm">
                <MaterialIcon name="error" size="md" className="shrink-0" />
                <div>
                  <p className="font-bold uppercase tracking-wider">Error loading category</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            ) : (
              <>
                <ProductGrid
                  products={products}
                  isLoading={isLoading}
                  onClearFilters={() =>
                    handleFilterChange({
                      category: categorySlug,
                      minPrice: undefined,
                      maxPrice: undefined,
                      sizes: [],
                      colors: [],
                      sort: "featured",
                    })
                  }
                />

                {/* 4. Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-stitch-border">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      <MaterialIcon name="chevron_left" size="xs" className="mr-1" />
                      Previous
                    </Button>
                    <span className="text-xs font-bold uppercase tracking-wider text-stitch-primary">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Next
                      <MaterialIcon name="chevron_right" size="xs" className="ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

