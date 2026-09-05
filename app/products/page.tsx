import React, { Suspense } from "react";
import { getProducts } from "@/modules/products/service";
import { ProductsClient } from "@/components/product/ProductsClient";
import { Container } from "@/components/ui/Container";
import { Metadata } from "next";

export const revalidate = 60; // ISR cache on Edge for 60 seconds

export const metadata: Metadata = {
  title: "All Products | Zudio",
  description: "Browse the latest everyday fashion across menswear, womenswear, kidswear, and footwear.",
};


export default async function ProductsPage() {
  let initialProducts: any[] = [];
  let initialTotal = 0;
  let initialTotalPages = 1;

  try {
    const result = await getProducts({
      sort: "featured",
      page: 1,
      limit: 12,
    });
    initialProducts = result.products;
    initialTotal = result.total;
    initialTotalPages = result.totalPages;
  } catch (err) {
    console.error("Error pre-rendering products page:", err);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-stitch-surface-base" />}>
      <ProductsClient
        initialProducts={initialProducts}
        initialTotal={initialTotal}
        initialTotalPages={initialTotalPages}
        initialFilters={{
          category: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          sizes: [],
          colors: [],
          sort: "featured",
        }}
      />
    </Suspense>
  );
}
