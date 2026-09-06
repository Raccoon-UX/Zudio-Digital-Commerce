import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ProductCard } from "@/components/product/ProductCard";
import { getFeaturedProducts, getNewArrivals } from "@/modules/products/service";
import { ProductCardDTO } from "@/modules/products/types";
import { APP_CONFIG } from "@/lib/constants";

export const revalidate = 60; // ISR cache on Edge for 60 seconds

// High-resolution editorial campaign background
const HERO_BG_IMAGE = "/images/hero-reference.png";
const HERO_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&auto=format&fit=crop&q=85";

const SECONDARY_CATEGORY_PILLS = [
  {
    name: "New Arrivals",
    href: "/products?sort=newest",
    icon: "auto_awesome",
    bgClass: "bg-[#FDF2F8] hover:bg-[#FCE7F3] border-pink-200/80 text-pink-700",
    iconColor: "text-pink-600",
  },
  {
    name: "Women",
    href: "/categories/women",
    icon: "woman",
    bgClass: "bg-[#FFF1F2] hover:bg-[#FFE4E6] border-rose-200/80 text-rose-700",
    iconColor: "text-rose-600",
  },
  {
    name: "Men",
    href: "/categories/men",
    icon: "man",
    bgClass: "bg-[#EFF6FF] hover:bg-[#DBEAFE] border-blue-200/80 text-blue-700",
    iconColor: "text-blue-600",
  },
  {
    name: "Kids",
    href: "/categories/kids",
    icon: "sentiment_satisfied",
    bgClass: "bg-[#FEFCE8] hover:bg-[#FEF9C3] border-amber-200/80 text-amber-800",
    iconColor: "text-amber-600",
  },
  {
    name: "Footwear",
    href: "/categories/footwear",
    icon: "checkroom",
    bgClass: "bg-[#F5F3FF] hover:bg-[#EDE9FE] border-purple-200/80 text-purple-700",
    iconColor: "text-purple-600",
  },
  {
    name: "Store Locator",
    href: "/stores",
    icon: "storefront",
    bgClass: "bg-[#ECFDF5] hover:bg-[#D1FAE5] border-emerald-200/80 text-emerald-700",
    iconColor: "text-emerald-600",
  },
];

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
    <div className="flex flex-col min-h-screen bg-white text-neutral-900">
      {/* 1. Secondary Pastel Category Navigation (Centered Horizontal Pill Row) */}
      <section className="bg-white border-b border-neutral-100 py-3.5 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <Container size="xl" className="flex items-center gap-2.5 sm:gap-3.5 justify-start md:justify-center">
          {SECONDARY_CATEGORY_PILLS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-tight border shadow-xs transition-all hover:scale-[1.02] active:scale-95 shrink-0 whitespace-nowrap ${item.bgClass}`}
            >
              <MaterialIcon name={item.icon} size="sm" className={item.iconColor} />
              <span>{item.name}</span>
            </Link>
          ))}
        </Container>
      </section>

      {/* 2. Major Editorial Hero Section (Split Composition matching Reference) */}
      <section className="relative w-full overflow-hidden bg-[#D3CECA] text-neutral-900 border-b border-neutral-200">
        <div className="relative min-h-[460px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-[640px] flex items-center">
          {/* Background Lifestyle Image & Warm Gradient */}
          <div className="absolute inset-0 z-0">
            <Image
              src={HERO_BG_IMAGE}
              alt="Zudio Fashion Campaign"
              fill
              priority
              sizes="100vw"
              className="object-cover object-right md:object-center"
            />
            {/* Subtle left-side legibility enhancement gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#D3CECA]/90 via-[#D3CECA]/50 to-transparent z-[1] md:hidden" />
          </div>

          <Container size="xl" className="relative z-10 w-full py-10 sm:py-14 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Editorial Content Block */}
              <div className="md:col-span-7 lg:col-span-6 space-y-4 sm:space-y-5">
                {/* Eyebrow Label */}
                <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.22em] uppercase text-neutral-900 select-none">
                  <span>NEW COLLECTION 2026 / 2027</span>
                </div>

                {/* Massive Bold Headline (NEW SEASON. in Black, NEW ENERGY. in White) */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black uppercase tracking-tight leading-[0.88] select-none">
                  <span className="block text-neutral-950">NEW SEASON.</span>
                  <span className="block text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)]">
                    NEW ENERGY.
                  </span>
                </h1>

                {/* Supporting Editorial Paragraph */}
                <p className="text-xs sm:text-sm md:text-base text-neutral-800 font-medium leading-relaxed max-w-md">
                  Discover everyday styles made for you. Trending silhouettes, breathable fabrics, and uncompromised value.
                </p>

                {/* CTA Buttons with Directional Arrows */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link href="/categories/women">
                    <Button
                      size="lg"
                      className="bg-neutral-950 text-white hover:bg-neutral-800 rounded-md font-black text-xs sm:text-sm uppercase tracking-wider px-6 sm:px-8 py-3.5 sm:py-4 shadow-lg flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95"
                    >
                      <span>SHOP WOMEN</span>
                      <MaterialIcon name="arrow_forward" size="sm" />
                    </Button>
                  </Link>

                  <Link href="/categories/men">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-[#E7E5E4]/85 text-neutral-950 hover:bg-[#D6D3D1] border border-neutral-400/80 rounded-md font-black text-xs sm:text-sm uppercase tracking-wider px-6 sm:px-8 py-3.5 sm:py-4 shadow-sm flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95"
                    >
                      <span>SHOP MEN</span>
                      <MaterialIcon name="arrow_forward" size="sm" />
                    </Button>
                  </Link>
                </div>

                {/* Bottom Tagline Strip */}
                <div className="pt-3">
                  <p className="text-[11px] font-black tracking-[0.24em] uppercase text-neutral-800/80 select-none">
                    TRENDING &nbsp;|&nbsp; AFFORDABLE &nbsp;|&nbsp; EVERYDAY FASHION
                  </p>
                </div>
              </div>

              {/* Right Side Visual Accents & Season Metadata */}
              <div className="hidden md:flex md:col-span-5 lg:col-span-6 flex-col justify-between items-end h-full min-h-[460px] pointer-events-none select-none">
                {/* Style Lives Here Calligraphic Typography Badge */}
                <div className="mt-8 mr-4 sm:mr-8 bg-white/20 backdrop-blur-xs p-3 rounded-lg border border-white/20">
                  <span className="font-serif italic font-bold text-3xl sm:text-4xl text-neutral-900 tracking-tight drop-shadow-sm">
                    Style Lives Here
                  </span>
                </div>

                {/* Bottom Right Season Metadata */}
                <div className="text-right pb-2 pr-2">
                  <span className="text-xs font-black uppercase tracking-[0.25em] text-neutral-800">
                    ZUDIO SS&apos;26 —
                  </span>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* 3. Bottom Benefits / Service Strip (Matching Reference 4-Column Strip) */}
      <section className="bg-white border-b border-neutral-200 py-6 sm:py-7">
        <Container size="xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
            {/* 1. Free Delivery */}
            <div className="flex items-center gap-3.5 sm:px-4 pt-3 sm:pt-0">
              <div className="w-11 h-11 rounded-full bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0 shadow-xs">
                <MaterialIcon name="local_shipping" size="md" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-neutral-900">
                  Free Delivery
                </h4>
                <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                  On orders above ₹{APP_CONFIG.freeDeliveryThreshold}
                </p>
              </div>
            </div>

            {/* 2. In-Store Holds / Easy Returns */}
            <div className="flex items-center gap-3.5 sm:px-4 pt-3 sm:pt-0">
              <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                <MaterialIcon name="storefront" size="md" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-neutral-900">
                  In-Store Holds
                </h4>
                <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                  2-hr trial reservation
                </p>
              </div>
            </div>

            {/* 3. Secure Payments */}
            <div className="flex items-center gap-3.5 sm:px-4 pt-3 sm:pt-0">
              <div className="w-11 h-11 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
                <MaterialIcon name="verified_user" size="md" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-neutral-900">
                  Secure Payments
                </h4>
                <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                  Razorpay & UPI Supported
                </p>
              </div>
            </div>

            {/* 4. 100 Stores */}
            <div className="flex items-center gap-3.5 sm:px-4 pt-3 sm:pt-0">
              <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <MaterialIcon name="location_on" size="md" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-neutral-900">
                  100 Stores
                </h4>
                <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                  Across India
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Shop by Category Bento Grid */}
      <section className="pt-10 sm:pt-14 pb-12 sm:pb-16 bg-neutral-50/50">
        <Container size="xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-neutral-500">
                Collections
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-950 mt-1">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              <span>View All Products</span>
              <MaterialIcon name="arrow_forward" size="sm" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6">
            {CATEGORY_TILES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group relative block overflow-hidden rounded-lg bg-white border border-neutral-200/80 hover:border-neutral-900 hover:shadow-xl transition-all duration-300"
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

                  <div className="absolute inset-0 p-3.5 sm:p-5 flex flex-col justify-between text-white">
                    <span className="self-start px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white border border-white/20">
                      {cat.badge}
                    </span>
                    <div className="space-y-1 transform transition-transform duration-300 group-hover:-translate-y-1">
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-neutral-300 line-clamp-1 font-medium">
                        {cat.subtitle}
                      </p>
                      <div className="pt-1.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white group-hover:text-neutral-200">
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

      {/* 5. Trending Drops / Featured Catalog Showcase */}
      <section className="py-12 sm:py-16 bg-white border-t border-neutral-200">
        <Container size="xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-neutral-500 mb-1">
                <MaterialIcon name="bolt" size="sm" className="text-amber-500" />
                <span>Fresh Off The Rack</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-950">
                Trending Drops
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              <span>Explore Catalog</span>
              <MaterialIcon name="arrow_forward" size="sm" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
            {featuredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        </Container>
      </section>

      {/* 6. Omnichannel Store Hold / Reservation Pilot Callout */}
      <section className="py-14 sm:py-20 bg-neutral-950 text-white">
        <Container size="xl">
          <div className="border border-neutral-800 rounded-xl p-6 sm:p-10 md:p-12 bg-neutral-900/80 backdrop-blur-sm flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="max-w-2xl space-y-3 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-neutral-400">
                <MaterialIcon name="storefront" size="sm" className="text-emerald-400" />
                <span>Omnichannel Feature</span>
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                Want to try before you buy?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
                Select your preferred size online, check live stock at your nearest store, and place a 2-hour hold reservation so it is ready when you arrive.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3.5 shrink-0 w-full sm:w-auto">
              <Link href="/stores" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-white text-neutral-950 hover:bg-neutral-200 font-black uppercase tracking-wider rounded-md"
                >
                  <MaterialIcon name="location_on" size="sm" className="mr-2 text-neutral-950" />
                  Find Nearby Stores
                </Button>
              </Link>
              <Link href="/products" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-800 font-black uppercase tracking-wider rounded-md"
                >
                  <MaterialIcon name="shopping_bag" size="sm" className="mr-2" />
                  Explore Catalog
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 7. Brand Value Pillars */}
      <section className="py-12 bg-neutral-50/70 border-t border-neutral-200">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex items-start gap-4 p-5 bg-white border border-neutral-200/80 rounded-lg shadow-xs">
              <div className="p-3 bg-neutral-950 text-white rounded-md shrink-0">
                <MaterialIcon name="sell" size="md" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950">Everyday Low Pricing</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed font-medium">High-fashion aesthetics and durable quality crafted at genuinely affordable prices.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-white border border-neutral-200/80 rounded-lg shadow-xs">
              <div className="p-3 bg-neutral-950 text-white rounded-md shrink-0">
                <MaterialIcon name="storefront" size="md" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950">Store-Level Inventory</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed font-medium">Check live size and color availability in real time across physical retail stores.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-white border border-neutral-200/80 rounded-lg shadow-xs">
              <div className="p-3 bg-neutral-950 text-white rounded-md shrink-0">
                <MaterialIcon name="local_shipping" size="md" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950">Fast Delivery & Hold</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed font-medium">Reliable doorstep shipping or reserve items for a convenient 2-hour in-store trial.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
