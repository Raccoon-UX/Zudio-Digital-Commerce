"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters, FilterState } from "@/components/product/ProductFilters";
import { ProductCardDTO } from "@/modules/products/types";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

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
    <div className="py-8 bg-white min-h-screen">
      <Container size="xl">
        {/* Header Breadcrumb & Title */}
        <div className="mb-6">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
            <span>Home</span> / <span>Catalog</span>
            {filters.category && <span className="text-black"> / {filters.category}</span>}
            {querySearch && <span className="text-black"> / Search: "{querySearch}"</span>}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            {querySearch
              ? `Results for "${querySearch}"`
              : filters.category
              ? `${filters.category} Collection`
              : "All Fashion"}
          </h1>
        </div>

        {/* Main Grid + Filter Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters (Sidebar / Mobile Trigger) */}
          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            totalProducts={total}
          />

          {/* Catalog Content Area */}
          <div className="flex-1">
            {error ? (
              <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Error loading catalog</p>
                  <p className="text-rose-600 mt-0.5">{error}</p>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-neutral-200">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 bg-white min-h-screen">
          <Container size="xl">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full" />
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
