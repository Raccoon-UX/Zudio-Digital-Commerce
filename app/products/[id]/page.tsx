import React, { cache } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { getProductByIdOrSlug, getProducts } from "@/modules/products/service";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { Metadata } from "next";
import { ProductCardDTO } from "@/modules/products/types";

interface PageProps {
  params: {
    id: string;
  };
}

export const revalidate = 120; // ISR cache on Edge for 120 seconds
export const dynamicParams = true;

// Pre-render on demand with ISR to prevent exhausting DB connection pool during build
export function generateStaticParams() {
  return [];
}

// Deduplicate product lookup between generateMetadata and ProductDetailPage
const getCachedProduct = cache(async (idOrSlug: string) => {
  try {
    return await getProductByIdOrSlug(idOrSlug);
  } catch (err) {
    console.error("Error loading product for PDP:", err);
    return null;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getCachedProduct(params.id);
  if (!product) {
    return { title: "Product Not Found | Zudio" };
  }
  return {
    title: `${product.name} | Zudio`,
    description: product.description || `Buy ${product.name} at best price online.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getCachedProduct(params.id);

  if (!product) {
    return (
      <div className="py-20 bg-stitch-surface-base min-h-[60vh] flex items-center justify-center text-stitch-primary">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-stitch-surface-container border border-stitch-error/30 inline-block rounded-full mb-4">
            <MaterialIcon name="error" size="xl" className="text-stitch-error" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-stitch-primary mb-2">
            Product Not Found
          </h2>
          <p className="text-xs text-stitch-secondary-text mb-6 max-w-sm mx-auto">
            The requested product is unavailable or does not exist in our catalog.
          </p>
          <Link href="/products">
            <Button variant="primary" size="md">
              Back to Catalog
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  // Fetch related products from the same category
  let relatedProducts: ProductCardDTO[] = [];
  try {
    const result = await getProducts({ category: product.categorySlug, limit: 5 });
    relatedProducts = result.products.filter((p) => p.id !== product.id).slice(0, 4);
  } catch {
    relatedProducts = [];
  }

  return (
    <ProductDetailClient
      initialProduct={product}
      relatedProducts={relatedProducts}
    />
  );
}
