import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";
import { getProductByIdOrSlug } from "@/modules/products/service";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { Metadata } from "next";

interface PageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductByIdOrSlug(params.id);
  if (!product) {
    return { title: "Product Not Found | Zudio" };
  }
  return {
    title: `${product.name} | Zudio`,
    description: product.description || `Buy ${product.name} at best price online.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductByIdOrSlug(params.id);

  if (!product) {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-rose-50 border border-rose-200 inline-block rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-rose-600" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-2">
            Product Not Found
          </h2>
          <p className="text-xs text-neutral-500 mb-6 max-w-sm mx-auto">
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

  return <ProductDetailClient initialProduct={product} />;
}
