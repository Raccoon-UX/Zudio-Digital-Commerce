import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ProductCard } from "@/components/product/ProductCard";
import { getFeaturedProducts, getNewArrivals } from "@/modules/products/service";
import { ProductCardDTO } from "@/modules/products/types";

export const revalidate = 60; // ISR cache on Edge for 60 seconds

// High-resolution Stitch-compliant editorial imagery
const HERO_BG_IMAGE = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&auto=format&fit=crop&q=85";

const CATEGORY_TILES = [
  {
    name: "Women",
    href: "/categories/women",
    subtitle: "Dresses, Tops & Everyday Styles",
    badge: "New Drops",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6fS5o7EiEcIdMSo-PJTu-dYf6PUZfMLpofazBdAQFXMmVZAiEx1Fuw6TwLWJ3XHwn8qpwfdFY_NqkhNckZJT9gFg7z0dec93ZwQpnM9Udt2xwoGXZmWbe8Nut4_Ih6vnqfdXaOZOzp4aDktjsfhwlSh5NbXkdNamkAH0YOgqwf4jMK3nt6Xkwhny4Qlk9mGzCM2_4td6HLVB9zTWMC6MtoH0Gbq3w88oHuSFbZ1mnhEV4lCiVyiS7",
    fallbackUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=85",
  },
  {
    name: "Men",
    href: "/categories/men",
    subtitle: "Casuals, Tees, Oversized & Denims",
    badge: "Trending",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA68DCLTO-kBnFGyDQ0LZySPaTxMX3HoWO72Rg1jEvGd3Ib7DjsH17LLMieI5fcnTZDrPKDd5b-wwlT-ncD-zIhqbIPBCWqttW6WeAuW-g6DxYOfbfOZAclDSMkzsXbYLTWLNHmzSx0CTJ3wakztlPJxE-dSQn4QSLn27SwvLZtiY5fPjAeEq9rJyIBykW75tcaLiB7GyTZ9I3LRTUF_VThRADTv9_dZ9Esg8VaFTf8KhSabRDFjrx9",
    fallbackUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
  },
  {
    name: "Kids",
    href: "/categories/kids",
    subtitle: "Playful Everyday Wear & Essentials",
    badge: "Popular",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdku4_YJuczhPBkmzqbToxJBOk4s-p72SOl9FDNhg5W6nLEKKmea-22RbtVzNH0SkUmQTdxmbLsN1e0z5xw1WaPny7NryK0bNXJLjttxwIYm30ulmH8dBSpH0-KDy7RLCzjXgdfXiLz9RnB3-KA9QxaIXspr6VXHr038JWPvSQ3xHwWaiPCGIzZqv2MU2v3o_vs9BNcCvMpgtOjnFXSaGAlbx4B-UN00ZKHBeiEEU9qnBsuLpLDea9",
    fallbackUrl: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1000&auto=format&fit=crop&q=85",
  },
  {
    name: "Footwear",
    href: "/categories/footwear",
    subtitle: "Sneakers, Sliders, Flats & Loafers",
    badge: "Best Value",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1000&auto=format&fit=crop&q=85",
    fallbackUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1000&auto=format&fit=crop&q=85",
  },
];

const QUICK_NAV_ITEMS = [
  { name: "New Arrivals", href: "/products", icon: "auto_awesome" },
  { name: "Women", href: "/categories/women", icon: "woman" },
  { name: "Men", href: "/categories/men", icon: "man" },
  { name: "Kids", href: "/categories/kids", icon: "child_care" },
  { name: "Footwear", href: "/categories/footwear", icon: "checkroom" },
  { name: "Store Locator", href: "/stores", icon: "storefront" },
];

const FALLBACK_PRODUCTS: ProductCardDTO[] = [
  {
    id: "fb-1",
    name: "Oversized Cotton Graphic Tee",
    slug: "oversized-cotton-graphic-tee",
    categoryName: "Men",
    categorySlug: "men",
    price: 399,
    compareAtPrice: 599,
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    secondaryImageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    isNewArrival: true,
    isFeatured: true,
    availableSizes: ["S", "M", "L", "XL"],
    availableColors: [{ name: "Black", hexCode: "#000000" }, { name: "Off White", hexCode: "#F5F5F0" }],
  },
  {
    id: "fb-2",
    name: "Relaxed Fit Poplin Resort Shirt",
    slug: "relaxed-fit-poplin-resort-shirt",
    categoryName: "Women",
    categorySlug: "women",
    price: 599,
    compareAtPrice: 799,
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    secondaryImageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    isNewArrival: true,
    isFeatured: true,
    availableSizes: ["XS", "S", "M", "L"],
    availableColors: [{ name: "Sage Green", hexCode: "#8A9A86" }, { name: "Cream", hexCode: "#FFFDD0" }],
  },
  {
    id: "fb-3",
    name: "Classic Straight Leg Denim Jeans",
    slug: "classic-straight-leg-denim-jeans",
    categoryName: "Men",
    categorySlug: "men",
    price: 799,
    compareAtPrice: 1199,
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    secondaryImageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80",
    isNewArrival: false,
    isFeatured: true,
    availableSizes: ["30", "32", "34", "36"],
    availableColors: [{ name: "Vintage Blue", hexCode: "#2B4C7E" }],
  },
  {
    id: "fb-4",
    name: "Chunky Sole Casual Streetwear Sneaker",
    slug: "chunky-sole-casual-streetwear-sneaker",
    categoryName: "Footwear",
    categorySlug: "footwear",
    price: 699,
    compareAtPrice: 999,
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
    secondaryImageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80",
    isNewArrival: true,
    isFeatured: true,
    availableSizes: ["6", "7", "8", "9", "10"],
    availableColors: [{ name: "White/Grey", hexCode: "#E0E0E0" }, { name: "Black", hexCode: "#1A1A1A" }],
  },
];

export default async function HomePage() {
  let featuredProducts: ProductCardDTO[] = [];
  try {
    featuredProducts = await getFeaturedProducts(4);
    if (!featuredProducts || featuredProducts.length === 0) {
      const newArrivals = await getNewArrivals(4);
      featuredProducts = newArrivals.length > 0 ? newArrivals : FALLBACK_PRODUCTS;
    }
  } catch {
    featuredProducts = FALLBACK_PRODUCTS;
  }

  return (
    <div className="flex flex-col min-h-screen bg-stitch-surface-base text-stitch-primary">
      {/* 1. Category Quick-Bar (Horizontal Scrollable Chips) */}
      <section className="bg-stitch-surface-base border-b border-stitch-border sticky top-16 z-30 overflow-x-auto scrollbar-none py-2.5 px-4 sm:px-6">
        <Container size="xl" className="flex items-center gap-2 sm:gap-3 justify-start md:justify-center">
          {QUICK_NAV_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-stitch-surface-container/60 hover:bg-stitch-surface-container text-stitch-primary hover:text-black border border-stitch-border transition-colors shrink-0 whitespace-nowrap active:scale-95"
            >
              <MaterialIcon name={item.icon} size="sm" className="text-stitch-secondary-text" />
              <span>{item.name}</span>
            </Link>
          ))}
        </Container>
      </section>

      {/* 2. Stitch Hero Section — High-Contrast Compact Fashion Editorial */}
      <section className="relative w-full min-h-[420px] sm:min-h-[480px] md:min-h-[520px] overflow-hidden bg-neutral-950 text-white flex items-end pb-8 sm:pb-10 md:pb-12 pt-14 sm:pt-20 md:pt-24">
        <div className="absolute inset-0 z-0">
          <Image
            src={HERO_BG_IMAGE}
            alt="ZUDIO Fashion Editorial Collection"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%] scale-100 transition-transform duration-1000"
          />
          {/* Multi-layered editorial gradients for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent z-[2]" />
        </div>

        <Container size="xl" className="relative z-10 w-full">
          <div className="max-w-2xl space-y-3 sm:space-y-4 mt-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-black/60 border border-white/20 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <MaterialIcon name="auto_awesome" size="xs" className="text-stitch-accent" />
              <span>NEW COLLECTION 2026 / 2027</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.95] text-white drop-shadow-md">
              NEW SEASON.<br />
              <span>NEW ENERGY.</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-neutral-200 font-normal leading-relaxed max-w-lg drop-shadow">
              Discover everyday styles made for you. Trending silhouettes, breathable fabrics, and uncompromised value.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link href="/categories/women" className="w-full sm:w-auto">
                <Button
                  size="md"
                  className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 border-2 border-white font-black uppercase tracking-wider px-8 h-12 shadow-xl transition-all"
                >
                  SHOP WOMEN
                </Button>
              </Link>
              <Link href="/categories/men" className="w-full sm:w-auto">
                <Button
                  size="md"
                  className="w-full sm:w-auto bg-neutral-950 text-white hover:bg-white hover:text-black border-2 border-white font-black uppercase tracking-wider px-8 h-12 shadow-xl transition-all"
                >
                  SHOP MEN
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Shop by Category Bento Grid (Stitch Specification) */}
      <section className="pt-4 sm:pt-6 md:pt-8 pb-10 sm:pb-14 md:pb-16 bg-stitch-surface-base">
        <Container size="xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-secondary-text">
                Collections
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-stitch-primary mt-1">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stitch-primary hover:text-stitch-accent transition-colors"
            >
              <span>View All Products</span>
              <MaterialIcon name="arrow_forward" size="sm" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {CATEGORY_TILES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group relative block overflow-hidden rounded bg-stitch-surface-container border border-stitch-border hover:border-stitch-primary hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[3/4] w-full relative overflow-hidden bg-neutral-100">
                  <Image
                    src={cat.imageUrl}
                    alt={`${cat.name} Collection`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  
                  <div className="absolute inset-0 p-3 sm:p-5 flex flex-col justify-between text-white">
                    <span className="self-start px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white border border-white/20">
                      {cat.badge}
                    </span>
                    <div className="space-y-1 transform transition-transform duration-300 group-hover:-translate-y-1">
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-neutral-300 line-clamp-1">
                        {cat.subtitle}
                      </p>
                      <div className="pt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white group-hover:text-neutral-200">
                        <span>Explore</span>
                        <MaterialIcon name="arrow_forward" size="xs" className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Trending Drops / Featured Catalog Showcase */}
      <section className="py-12 sm:py-16 bg-stitch-surface-muted border-t border-stitch-border">
        <Container size="xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-stitch-secondary-text mb-1">
                <MaterialIcon name="bolt" size="sm" className="text-stitch-accent" />
                <span>Fresh Off The Rack</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-stitch-primary">
                Trending Drops
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stitch-primary hover:text-stitch-accent transition-colors"
            >
              <span>Explore Catalog</span>
              <MaterialIcon name="arrow_forward" size="sm" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {featuredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        </Container>
      </section>

      {/* 5. Omnichannel Store Hold / Reservation Pilot Callout */}
      <section className="py-14 sm:py-20 bg-neutral-950 text-white">
        <Container size="xl">
          <div className="border border-neutral-800 rounded-lg p-6 sm:p-10 md:p-12 bg-neutral-900/60 backdrop-blur-sm flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-stitch-accent">
                <MaterialIcon name="storefront" size="sm" />
                <span>Omnichannel Pilot Feature</span>
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                Want to try before you buy?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                Select your preferred size online, check live stock at your nearest store, and place a 2-hour hold reservation so it is ready when you arrive.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
              <Link href="/stores" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-wider"
                >
                  <MaterialIcon name="location_on" size="sm" className="mr-2" />
                  Find Nearby Stores
                </Button>
              </Link>
              <Link href="/products" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-800 font-bold uppercase tracking-wider"
                >
                  <MaterialIcon name="shopping_bag" size="sm" className="mr-2" />
                  Explore Catalog
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Brand Value Pillars (Stitch Surface Style) */}
      <section className="py-10 bg-stitch-surface-container/40 border-t border-stitch-border">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-5 bg-stitch-surface-base border border-stitch-border rounded">
              <div className="p-2.5 bg-stitch-primary text-white rounded shrink-0">
                <MaterialIcon name="sell" size="md" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stitch-primary">Everyday Low Pricing</h3>
                <p className="text-xs text-stitch-secondary-text mt-1 leading-relaxed">High-fashion aesthetics and durable quality crafted at genuinely affordable prices.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-stitch-surface-base border border-stitch-border rounded">
              <div className="p-2.5 bg-stitch-primary text-white rounded shrink-0">
                <MaterialIcon name="storefront" size="md" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stitch-primary">Store-Level Inventory</h3>
                <p className="text-xs text-stitch-secondary-text mt-1 leading-relaxed">Check live size and color availability in real time across physical retail stores.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-stitch-surface-base border border-stitch-border rounded">
              <div className="p-2.5 bg-stitch-primary text-white rounded shrink-0">
                <MaterialIcon name="local_shipping" size="md" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stitch-primary">Fast Delivery & Hold</h3>
                <p className="text-xs text-stitch-secondary-text mt-1 leading-relaxed">Reliable doorstep shipping or reserve items for a convenient 2-hour in-store trial.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
