import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MapPin, ShoppingBag, ArrowRight, Sparkles, Store, ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

const CATEGORY_IMAGES = {
  Men: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1400&auto=format&fit=crop&q=85",
  Women: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1400&auto=format&fit=crop&q=85",
  Kids: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1400&auto=format&fit=crop&q=85",
  Footwear: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1400&auto=format&fit=crop&q=85",
};

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&auto=format&fit=crop&q=85",
];

export default function HomePage() {
  const categories = [
    { name: "Men", href: "/categories/men", subtitle: "Casuals, Tees & Denims", badge: "Trending" },
    { name: "Women", href: "/categories/women", subtitle: "Dresses, Tops & Everyday Styles", badge: "New Drops" },
    { name: "Kids", href: "/categories/kids", subtitle: "Playful Everyday Wear", badge: "Popular" },
    { name: "Footwear", href: "/categories/footwear", subtitle: "Sneakers, Sliders & Flats", badge: "Great Value" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <section className="relative min-h-[620px] md:min-h-[700px] overflow-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 grid grid-cols-3 opacity-55">
          {HERO_IMAGES.map((src, i) => <div key={src} className="relative overflow-hidden"><img src={src} alt="Zudio fashion collection" className="h-full w-full object-cover scale-105" /><div className="absolute inset-0 bg-black/55" /></div>)}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />

        <Container size="xl" className="relative z-10 flex items-center min-h-[620px] md:min-h-[700px]">
          <div className="max-w-4xl space-y-6 py-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/55 border border-white/30 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Digital Commerce + Store Integration Pilot</span>
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-[7.2rem] font-black uppercase tracking-[-0.045em] leading-[0.82] text-white max-w-5xl">
              Everyday<br />Fashion.<br /><span className="text-neutral-300">Zero<br className="hidden sm:block" /> Compromise.</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-neutral-200 max-w-xl font-light leading-relaxed">
              Discover everyday styles, explore real product imagery, check store-level stock, and order online for fast home delivery.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 justify-start">
              <Link href="/products"><Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200"><ShoppingBag className="mr-2 h-4 w-4" />Explore Catalog</Button></Link>
              <Link href="/stores"><Button variant="outline" size="lg" className="w-full sm:w-auto border-white/50 text-white hover:bg-white hover:text-black"><MapPin className="mr-2 h-4 w-4" />Find Nearby Stores</Button></Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8 bg-neutral-50 border-y border-neutral-200">
        <Container size="xl"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{ icon: ShoppingBag, title: "Online Discovery", text: "Browse complete collections with clean imagery, transparent pricing and instant filters." }, { icon: Store, title: "Store-Level Stock", text: "Check exact size and colour availability before visiting a physical store." }, { icon: ShieldCheck, title: "Seamless Commerce", text: "Fast checkout, payment integration and complete order tracking." }].map(({ icon: Icon, title, text }, i) => <div key={title} className="flex items-start gap-4 p-5 bg-white border border-neutral-200"><div className="p-3 bg-black text-white shrink-0"><Icon className="h-5 w-5" /></div><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">0{i + 1}</p><h3 className="text-sm font-bold uppercase tracking-wider text-black">{title}</h3><p className="text-xs text-neutral-600 mt-1 leading-relaxed">{text}</p></div></div>)}
        </div></Container>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <Container size="xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Collections</p><h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black mt-1">Shop By Category</h2></div><Link href="/products" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-black hover:underline">View All Products<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {categories.map((cat) => <Link key={cat.name} href={cat.href} className="group relative block overflow-hidden bg-neutral-900 border border-neutral-200 transition-all hover:border-black">
              <div className="aspect-[3/4] w-full relative overflow-hidden"><img src={CATEGORY_IMAGES[cat.name as keyof typeof CATEGORY_IMAGES]} alt={`${cat.name} collection`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between text-white"><Badge variant="secondary" className="self-start bg-white text-black font-semibold text-[9px]">{cat.badge}</Badge><div className="space-y-1 transform transition-transform duration-300 group-hover:translate-y-[-4px]"><h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">{cat.name}</h3><p className="text-[10px] sm:text-xs text-neutral-200">{cat.subtitle}</p><div className="pt-2 inline-flex items-center text-[10px] font-semibold tracking-wider uppercase">Explore<ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></div></div></div>
              </div>
            </Link>)}
          </div>
        </Container>
      </section>

      <section className="py-14 bg-neutral-950 text-white"><Container size="xl"><div className="border border-neutral-800 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8"><div className="max-w-2xl space-y-3 text-center lg:text-left"><span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Omnichannel Pilot Feature</span><h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Want to try before you buy?</h2><p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light">Select your preferred size online, verify stock at your nearest store, and place a 2-hour hold reservation so it's ready when you arrive.</p></div><div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto"><Link href="/stores" className="w-full sm:w-auto"><Button size="lg" className="w-full bg-white text-black hover:bg-neutral-200"><MapPin className="mr-2 h-4 w-4" />Locate Store</Button></Link><Link href="/admin" className="w-full sm:w-auto"><Button variant="outline" size="lg" className="w-full border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-900">Admin Portal</Button></Link></div></div></Container></section>
    </div>
  );
}
