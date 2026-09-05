import React from "react";
import { getProducts } from "@/modules/products/service";
import { CategoryClient } from "@/components/product/CategoryClient";
import { Metadata } from "next";

export const revalidate = 60; // ISR cache on Edge for 60 seconds
export const dynamicParams = true;

export function generateStaticParams() {
  return [
    { category: "men" },
    { category: "women" },
    { category: "kids" },
    { category: "footwear" },
  ];
}

interface PageProps {
  params: {
    category: string;
  };
}

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categorySlug = params.category?.toLowerCase() || "men";
  const meta = categoryTitles[categorySlug] || {
    title: `${categorySlug.toUpperCase()} Collection`,
    subtitle: "Everyday fashion curated for you.",
  };
  return {
    title: `${meta.title} | Zudio`,
    description: meta.subtitle,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const categorySlug = params.category?.toLowerCase() || "men";
  const meta = categoryTitles[categorySlug] || {
    title: `${categorySlug.toUpperCase()} Collection`,
    subtitle: "Everyday fashion curated for you.",
    bgImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1400&auto=format&fit=crop&q=85",
  };

  let initialProducts: any[] = [];
  let initialTotal = 0;
  let initialTotalPages = 1;

  try {
    const result = await getProducts({
      category: categorySlug,
      page: 1,
      limit: 12,
      sort: "featured",
    });
    initialProducts = result.products;
    initialTotal = result.total;
    initialTotalPages = result.totalPages;
  } catch (err) {
    console.error("Error pre-rendering category page:", err);
  }

  return (
    <CategoryClient
      categorySlug={categorySlug}
      initialProducts={initialProducts}
      initialTotal={initialTotal}
      initialTotalPages={initialTotalPages}
      meta={meta}
    />
  );
}
