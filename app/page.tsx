import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MapPin, ShoppingBag, ArrowRight, Sparkles, Store, ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export default function HomePage() {
  const categories = [
    {
      name: "Men",
      href: "/categories/men",
      subtitle: "Casuals, Tees & Denims",
      badge: "Trending",
      imageBg: "bg-neutral-900",
    },
    {
      name: "Women",
      href: "/categories/women",
      subtitle: "Dresses, Tops & Ethnic",
      badge: "New Drops",
      imageBg: "bg-neutral-800",
    },
    {
      name: "Kids",
      href: "/categories/kids",
      subtitle: "Playful Everyday Wear",
      badge: "Popular",
      imageBg: "bg-neutral-700",
    },
    {
      name: "Footwear",
      href: "/categories/footwear",
      subtitle: "Sneakers, Sliders & Flats",
      badge: "Great Value",
      imageBg: "bg-neutral-850",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-neutral-950 text-white py-16 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <Container size="xl" className="relative z-10">
          <div className="max-w-3xl space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-700 text-xs font-semibold uppercase tracking-widest text-neutral-300">
              <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
              <span>Digital Commerce + Store Integration Pilot</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none text-white">
              Everyday Fashion. <br />
              <span className="text-neutral-400">Zero Compromise.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-xl font-light leading-relaxed">
              Explore curated everyday styles, check real-time stock across physical retail stores, or order online for fast home delivery.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Explore Catalog
                </Button>
              </Link>

              <Link href="/stores">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-neutral-500 text-white hover:bg-neutral-900"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Find Nearby Stores
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Philosophy Pillars Section */}
      <section className="py-8 bg-neutral-100 border-y border-neutral-200">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-4 bg-white border border-neutral-200">
              <div className="p-3 bg-black text-white shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                  1. Online Discovery
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Browse complete collections with clean imagery, transparent pricing, and instant filter capabilities.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white border border-neutral-200">
              <div className="p-3 bg-black text-white shrink-0">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                  2. Store-Level Stock
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Check exact size and color availability in any physical store before visiting, with 2-hour reservation holds.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white border border-neutral-200">
              <div className="p-3 bg-black text-white shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                  3. Seamless Commerce
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Fast checkout, verified Razorpay payment integration, and complete order tracking.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Category Grid Section */}
      <section className="py-16 bg-white">
        <Container size="xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Collections
              </p>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
                Shop By Category
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-black hover:underline"
            >
              <span>View All Products</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group relative block overflow-hidden bg-neutral-900 border border-neutral-200 transition-all hover:border-black"
              >
                <div className="aspect-[3/4] w-full relative flex flex-col justify-between p-6 bg-gradient-to-t from-black/90 via-black/40 to-black/20 text-white">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-white text-black font-semibold">
                      {cat.badge}
                    </Badge>
                  </div>

                  <div className="space-y-1 transform transition-transform duration-300 group-hover:translate-y-[-4px]">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-neutral-300">{cat.subtitle}</p>
                    <div className="pt-3 inline-flex items-center text-xs font-semibold tracking-wider uppercase text-white/90 group-hover:text-white">
                      <span>Explore</span>
                      <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Store Integration Highlight */}
      <section className="py-14 bg-neutral-950 text-white">
        <Container size="xl">
          <div className="border border-neutral-800 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3 text-center lg:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Omnichannel Pilot Feature
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Want to try before you buy?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light">
                Select your preferred size online, verify stock at your nearest store, and place a 2-hour hold reservation so it's ready when you arrive.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
              <Link href="/stores" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-white text-black hover:bg-neutral-200">
                  <MapPin className="mr-2 h-4 w-4" />
                  Locate Store
                </Button>
              </Link>
              <Link href="/admin" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-900"
                >
                  Admin Portal
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
