"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters, FilterState } from "@/components/product/ProductFilters";
import { ProductCardDTO } from "@/modules/products/types";
import { AlertCircle } from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;

  const [products, setProducts] = useState<ProductCardDTO[]>([]);
  const [total, setTotal] = useState(0);
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

  const categoryTitles: Record<string, { title: string; subtitle: string }> = {
    men: { title: "Men's Collection", subtitle: "Contemporary everyday tees, shirts, and bottom wear" },
    women: { title: "Women's Collection", subtitle: "Trending dresses, tops, ethnic kurtas, and denims" },
    kids: { title: "Kids' Collection", subtitle: "Playful, comfortable clothing sets for boys and girls" },
    footwear: { title: "Footwear & Accessories", subtitle: "Everyday sneakers, sliders, and casual footwear" },
  };

  const currentMeta = categoryTitles[categorySlug] || {
    title: `${categorySlug.toUpperCase()} Collection`,
    subtitle: "Everyday fashion curated for you.",
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    queryParams.set("category", categorySlug);
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
          setError(data.error?.message || "Failed to load category products.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error fetching category products:", err);
        setError("Unable to connect to database.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categorySlug, filters]);

  return (
    <div className="py-8 bg-white min-h-screen">
      <Container size="xl">
        {/* Category Hero Banner */}
        <div className="bg-neutral-950 text-white p-8 sm:p-12 mb-8 border border-neutral-800">
          <div className="text-xs text-neutral-400 uppercase tracking-widest mb-2">
            <span>Home</span> / <span>Categories</span> /{" "}
            <span className="text-white">{categorySlug}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            {currentMeta.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-2 max-w-xl font-light">
            {currentMeta.subtitle}
          </p>
        </div>

        {/* Main Grid + Filter Layout */}
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
                  <p className="font-bold">Error loading category</p>
                  <p className="text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
            ) : (
              <ProductGrid
                products={products}
                isLoading={isLoading}
                onClearFilters={() =>
                  setFilters({
                    category: categorySlug,
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
