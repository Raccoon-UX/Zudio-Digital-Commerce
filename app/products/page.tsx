"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters, FilterState } from "@/components/product/ProductFilters";
import { ProductCardDTO } from "@/modules/products/types";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Button } from "@/components/ui/Button";

function ProductsContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductCardDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filter state from search params
  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get("category") || undefined,
    minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
    maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
    sizes: searchParams.get("sizes") ? searchParams.get("sizes")!.split(",") : [],
    colors: searchParams.get("colors") ? searchParams.get("colors")!.split(",") : [],
    sort: (searchParams.get("sort") as FilterState["sort"]) || "featured",
  });

  const querySearch = searchParams.get("q") || searchParams.get("search") || undefined;

  const fetchProducts = useCallback(async (currentFilters: FilterState, currentPage: number) => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (querySearch) params.set("q", querySearch);
    if (currentFilters.category && currentFilters.category !== "all") {
      params.set("category", currentFilters.category);
    }
    if (currentFilters.minPrice !== undefined) {
      params.set("minPrice", currentFilters.minPrice.toString());
    }
    if (currentFilters.maxPrice !== undefined) {
      params.set("maxPrice", currentFilters.maxPrice.toString());
    }
    if (currentFilters.sizes.length > 0) {
      params.set("sizes", currentFilters.sizes.join(","));
    }
    if (currentFilters.colors.length > 0) {
      params.set("colors", currentFilters.colors.join(","));
    }
    if (currentFilters.sort) {
      params.set("sort", currentFilters.sort);
    }
    params.set("page", currentPage.toString());
    params.set("limit", "12");

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data);
        setTotal(data.meta?.total || 0);
        setTotalPages(data.meta?.totalPages || 1);
      } else {
        setError(data.error?.message || "Failed to load products.");
      }
    } catch (err) {
      console.error("Fetch products error:", err);
      setError("Unable to connect to product catalog database.");
    } finally {
      setIsLoading(false);
    }
  }, [querySearch]);

  useEffect(() => {
    fetchProducts(filters, page);
  }, [filters, page, fetchProducts]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1); // reset to page 1 on filter change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="py-6 sm:py-8 bg-stitch-surface-base min-h-screen text-stitch-primary">
      <Container size="xl">
        {/* 1. Stitch PLP Breadcrumb */}
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
                Catalog
              </Link>
            </li>
            {filters.category && (
              <>
                <li>
                  <MaterialIcon name="chevron_right" size="xs" className="text-stitch-secondary-text/60" />
                </li>
                <li className="text-stitch-primary font-bold">{filters.category}</li>
              </>
            )}
            {querySearch && (
              <>
                <li>
                  <MaterialIcon name="chevron_right" size="xs" className="text-stitch-secondary-text/60" />
                </li>
                <li className="text-stitch-primary font-bold">"{querySearch}"</li>
              </>
            )}
          </ol>
        </nav>

        {/* 2. Page Header & Product Count */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-stitch-primary">
            {querySearch
              ? `Results for "${querySearch}"`
              : filters.category
              ? `${filters.category} Collection`
              : "All Fashion"}
          </h1>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-stitch-secondary-text mt-1">
            {total} Products Available
          </p>
        </div>

        {/* 3. Main Grid + Filter Layout */}
        <ProductFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          totalProducts={total}
        >
          {error ? (
            <div className="p-6 bg-stitch-surface-container border border-stitch-error/30 text-stitch-error text-xs flex items-center gap-3 rounded-sm">
              <MaterialIcon name="error" size="md" className="shrink-0" />
              <div>
                <p className="font-bold uppercase tracking-wider">Error loading catalog</p>
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
                    category: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    sizes: [],
                    colors: [],
                    sort: "featured",
                  })
                }
              />

              {/* 4. Stitch Styled Pagination Controls */}
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
        </ProductFilters>
      </Container>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 bg-stitch-surface-base min-h-screen">
          <Container size="xl">
            <div className="h-8 w-48 bg-stitch-surface-container rounded-sm animate-pulse mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] w-full bg-stitch-surface-container rounded-sm animate-pulse" />
              ))}
            </div>
          </Container>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

