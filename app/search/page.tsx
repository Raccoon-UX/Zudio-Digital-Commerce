"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters, FilterState } from "@/components/product/ProductFilters";
import { ProductCardDTO } from "@/modules/products/types";
import { Search, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<ProductCardDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sizes: [],
    colors: [],
    sort: "featured",
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (query) queryParams.set("q", query);
    if (filters.category) queryParams.set("category", filters.category);
    if (filters.minPrice !== undefined) queryParams.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== undefined) queryParams.set("maxPrice", filters.maxPrice.toString());
    if (filters.sizes.length > 0) queryParams.set("sizes", filters.sizes.join(","));
    if (filters.colors.length > 0) queryParams.set("colors", filters.colors.join(","));
    if (filters.sort) queryParams.set("sort", filters.sort);

    fetch(`/api/products?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setProducts(data.data);
          setTotal(data.meta?.total || 0);
        } else {
          setError(data.error?.message || "Failed to execute search.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Search fetch error:", err);
        setError("Unable to search product catalog database.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query, filters]);

  return (
    <div className="py-8 bg-white min-h-screen">
      <Container size="xl">
        {/* Search Header */}
        <div className="border-b border-neutral-200 pb-6 mb-8">
          <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider mb-2">
            <Search className="h-4 w-4 text-black" />
            <span>Search Results</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            {query ? `"${query}"` : "All Products"}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
            Found {total} items matching your query
          </p>
        </div>

        {/* Filters and Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          <ProductFilters
            filters={filters}
            onFilterChange={setFilters}
            totalProducts={total}
          />

          <div className="flex-1">
            {error ? (
              <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Search Error</p>
                  <p className="text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
            ) : (
              <ProductGrid
                products={products}
                isLoading={isLoading}
                emptyTitle={`No results found for "${query}"`}
                emptyDescription="Check your spelling, try more general keywords, or clear filter criteria."
                onClearFilters={() =>
                  setFilters({
                    category: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    sizes: [],
                    colors: [],
                    sort: "featured",
                  })
                }
              />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function SearchPage() {
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
      <SearchContent />
    </Suspense>
  );
}
