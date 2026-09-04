"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters, FilterState } from "@/components/product/ProductFilters";
import { ProductCardDTO } from "@/modules/products/types";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

const POPULAR_SEARCHES = [
  "Summer Collection",
  "Cargo Pants",
  "Graphic Tees",
  "Dresses",
  "Activewear",
  "Sneakers",
  "Oversized T-Shirts",
  "Denim Jackets",
];

const RECENT_SEARCHES_STORAGE_KEY = "zudio_recent_searches";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [inputVal, setInputVal] = useState(query);
  const [products, setProducts] = useState<ProductCardDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recent searches state (SSR-safe)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Trending picks state for discovery mode
  const [trendingProducts, setTrendingProducts] = useState<ProductCardDTO[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sizes: [],
    colors: [],
    sort: "featured",
  });

  // Sync input value when URL query changes
  useEffect(() => {
    setInputVal(query);
  }, [query]);

  // Load recent searches from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Fetch trending products for pre-search discovery state
  useEffect(() => {
    let isMounted = true;
    setIsTrendingLoading(true);

    fetch("/api/products?sort=featured&limit=8")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.data)) {
          setTrendingProducts(data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load trending picks:", err);
      })
      .finally(() => {
        if (isMounted) setIsTrendingLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Save term to recent searches
  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      const list: string[] = stored ? JSON.parse(stored) : [];
      const updated = [
        trimmed,
        ...list.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 8);

      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {}
    setRecentSearches([]);
  };

  // Execute a search
  const handleExecuteSearch = (term: string) => {
    const trimmed = term.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(inputVal);
  };

  const handleClearInput = () => {
    setInputVal("");
    router.push("/search");
  };

  // Active search query fetch effect
  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setTotal(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    queryParams.set("q", query.trim());
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

  const hasActiveQuery = Boolean(query.trim());

  return (
    <div className="py-6 sm:py-10 bg-stitch-surface-base min-h-screen text-stitch-primary font-sans">
      <Container size="xl">
        {/* Stitch Full-Width Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleInputSubmit} className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stitch-secondary-text pointer-events-none flex items-center">
              <MaterialIcon name="search" size="md" />
            </span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search for products, categories..."
              className="w-full h-12 pl-12 pr-12 border border-stitch-border bg-stitch-surface-base rounded text-sm sm:text-base text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors shadow-xs"
              autoFocus={!hasActiveQuery}
            />
            {inputVal && (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stitch-secondary-text hover:text-stitch-primary transition-colors p-1"
                aria-label="Clear Search"
              >
                <MaterialIcon name="close" size="sm" />
              </button>
            )}
          </form>
        </div>

        {/* State A: Pre-Search / Discovery State (No Active Query) */}
        {!hasActiveQuery ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
              {/* Recent Searches */}
              <section className="bg-stitch-surface-container/50 border border-stitch-border rounded-lg p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-stitch-primary flex items-center gap-2">
                    <MaterialIcon name="history" size="sm" className="text-stitch-secondary-text" />
                    Recent Searches
                  </h2>
                  {recentSearches.length > 0 && (
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-xs text-stitch-secondary-text hover:text-stitch-primary underline font-bold uppercase tracking-wider transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {recentSearches.length > 0 ? (
                  <ul className="space-y-2.5">
                    {recentSearches.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => {
                            setInputVal(term);
                            handleExecuteSearch(term);
                          }}
                          className="w-full flex items-center gap-3 text-xs sm:text-sm font-medium text-stitch-secondary-text hover:text-stitch-primary py-1 text-left transition-colors group"
                        >
                          <MaterialIcon
                            name="history"
                            size="sm"
                            className="text-neutral-400 group-hover:text-stitch-primary transition-colors"
                          />
                          <span className="group-hover:translate-x-0.5 transition-transform">
                            {term}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-6 text-center text-xs text-stitch-secondary-text">
                    No recent searches yet. Type above or tap a popular suggestion.
                  </div>
                )}
              </section>

              {/* Popular Right Now */}
              <section className="bg-stitch-surface-container/50 border border-stitch-border rounded-lg p-5 sm:p-6">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-stitch-primary mb-4 flex items-center gap-2">
                  <MaterialIcon name="local_fire_department" size="sm" className="text-amber-600" />
                  Popular Right Now
                </h2>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setInputVal(term);
                        handleExecuteSearch(term);
                      }}
                      className="px-3.5 py-1.5 border border-stitch-border bg-white rounded-full text-xs font-bold uppercase tracking-wider text-stitch-primary hover:border-stitch-primary hover:bg-stitch-primary hover:text-white transition-all shadow-xs"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Trending Picks Section */}
            <section className="pt-4 border-t border-stitch-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-stitch-primary flex items-center gap-2">
                    <MaterialIcon name="trending_up" size="md" className="text-stitch-accent" />
                    Trending Picks
                  </h2>
                  <p className="text-xs text-stitch-secondary-text uppercase tracking-wider mt-0.5">
                    Most loved styles this week
                  </p>
                </div>
              </div>

              <ProductGrid
                products={trendingProducts}
                isLoading={isTrendingLoading}
                emptyTitle="No trending products currently available"
                emptyDescription="Check back soon for freshly updated seasonal fashion."
              />
            </section>
          </div>
        ) : (
          /* State B: Active Search State */
          <div>
            {/* Search Header */}
            <div className="border-b border-stitch-border pb-5 mb-8">
              <div className="flex items-center gap-2 text-xs text-stitch-secondary-text uppercase tracking-wider mb-2">
                <MaterialIcon name="search" size="sm" className="text-stitch-primary" />
                <span>Search Results</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-stitch-primary">
                &ldquo;{query}&rdquo;
              </h1>
              <p className="text-xs text-stitch-secondary-text mt-1.5 uppercase tracking-wider">
                Found {total} {total === 1 ? "item" : "items"} matching your query
              </p>
            </div>

            {/* Filters and Results Grid */}
            <div className="flex flex-col lg:flex-row gap-8">
              <ProductFilters
                filters={filters}
                onFilterChange={setFilters}
                totalProducts={total}
              />

              <div className="flex-1">
                {error ? (
                  <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 rounded">
                    <MaterialIcon name="error" size="md" className="text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-wide">Search Error</p>
                      <p className="text-rose-600 mt-0.5">{error}</p>
                    </div>
                  </div>
                ) : !isLoading && products.length === 0 ? (
                  /* Empty Search Results State */
                  <div className="text-center py-16 px-4 bg-stitch-surface-container/30 border border-stitch-border rounded-lg">
                    <div className="w-16 h-16 bg-stitch-surface-container border border-stitch-border rounded-full flex items-center justify-center mx-auto mb-4 text-stitch-secondary-text">
                      <MaterialIcon name="search_off" size="xl" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-stitch-primary mb-2">
                      No results found for &ldquo;{query}&rdquo;
                    </h3>
                    <p className="text-xs sm:text-sm text-stitch-secondary-text max-w-md mx-auto mb-6">
                      Check your spelling, try broader keywords, or clear active filters to discover other pieces.
                    </p>

                    {/* Filter Reset Button */}
                    {(filters.category ||
                      filters.minPrice !== undefined ||
                      filters.maxPrice !== undefined ||
                      filters.sizes.length > 0 ||
                      filters.colors.length > 0) && (
                      <div className="mb-8">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setFilters({
                              category: undefined,
                              minPrice: undefined,
                              maxPrice: undefined,
                              sizes: [],
                              colors: [],
                              sort: "featured",
                            })
                          }
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    )}

                    {/* Popular search recovery pills */}
                    <div className="pt-6 border-t border-stitch-border max-w-lg mx-auto">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stitch-secondary-text mb-3">
                        Or browse popular categories:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {POPULAR_SEARCHES.slice(0, 5).map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setInputVal(term);
                              handleExecuteSearch(term);
                            }}
                            className="px-3 py-1.5 border border-stitch-border bg-white rounded-full text-xs font-bold uppercase tracking-wider text-stitch-primary hover:border-stitch-primary hover:bg-stitch-primary hover:text-white transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
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
          </div>
        )}
      </Container>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 bg-stitch-surface-base min-h-screen">
          <Container size="xl">
            <Skeleton className="h-12 w-full mb-8 rounded" />
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded" />
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
