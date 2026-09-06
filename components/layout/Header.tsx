"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Container } from "@/components/ui/Container";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { NAVIGATION_LINKS, APP_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ZudioLogo } from "./ZudioLogo";

export const Header: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    const fetchCounters = () => {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) setCartCount(data.data.itemCount || 0);
        })
        .catch(() => {});

      if (session?.user) {
        fetch("/api/wishlist")
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) setWishlistCount(data.data.count || 0);
          })
          .catch(() => {});
      } else {
        setWishlistCount(0);
      }
    };
    fetchCounters();
  }, [pathname, session]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (term) {
      try {
        const stored = localStorage.getItem("zudio_recent_searches");
        const list: string[] = stored ? JSON.parse(stored) : [];
        const updated = [term, ...list.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 8);
        localStorage.setItem("zudio_recent_searches", JSON.stringify(updated));
      } catch {}
      router.push(`/search?q=${encodeURIComponent(term)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] font-sans">
      {/* 1. Top Utility Strip */}
      <div className="bg-[#FFFFFF] border-b border-neutral-100 text-neutral-700 text-[10px] sm:text-[11px] py-1.5 px-4 sm:px-6 lg:px-8">
        <Container size="xl" className="flex items-center justify-between">
          <div className="font-extrabold tracking-[0.2em] uppercase text-neutral-900 select-none">
            FASHION FOR EVERY YOU
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] font-semibold text-neutral-600">
            <span className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
              <MaterialIcon name="local_shipping" size="xs" className="text-neutral-500" />
              Free Delivery on orders above ₹{APP_CONFIG.freeDeliveryThreshold}
            </span>
            <span className="text-neutral-300">|</span>
            <Link href="/reservations" className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
              <MaterialIcon name="storefront" size="xs" className="text-neutral-500" />
              In-Store Holds Available
            </Link>
            <span className="text-neutral-300">|</span>
            <Link href="/stores" className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
              <MaterialIcon name="location_on" size="xs" className="text-neutral-500" />
              100 Stores Across India
            </Link>
          </div>
        </Container>
      </div>

      {/* 2. Main Header Bar */}
      <Container size="xl">
        <div className="flex items-center justify-between h-16 md:h-18 lg:h-20 gap-3 sm:gap-6">
          {/* Left: Mobile Menu Toggle Button + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-neutral-900 hover:text-neutral-600 transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              <MaterialIcon name={isMobileMenuOpen ? "close" : "menu"} size="lg" />
            </button>

            <Link href="/" className="flex items-center shrink-0 group" aria-label="Zudio Home">
              <ZudioLogo className="w-[92px] sm:w-[104px] lg:w-[114px] h-auto text-neutral-950 transition-transform group-hover:scale-[1.02]" />
            </Link>
          </div>

          {/* Desktop Category Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 shrink-0">
            {NAVIGATION_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "text-xs font-black tracking-[0.14em] uppercase transition-all py-1.5 relative",
                    isActive
                      ? "text-neutral-950 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-neutral-950 after:rounded-full"
                      : "text-neutral-600 hover:text-neutral-950"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Center: Large Rounded Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center relative flex-1 max-w-sm xl:max-w-md mx-2 xl:mx-4"
          >
            <MaterialIcon
              name="search"
              size="sm"
              className="absolute left-3.5 text-neutral-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F3F4F6] hover:bg-[#EBECEF] focus:bg-white border border-neutral-200/80 focus:border-neutral-950 rounded-full py-2.5 pl-10 pr-4 text-xs font-medium text-neutral-900 placeholder:text-neutral-500 focus:outline-none transition-all shadow-xs"
            />
          </form>

          {/* Right: 4 Colorful Utility Icons Matching Reference */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 shrink-0">
            {/* 1. Stores (Soft Blue) */}
            <Link
              href="/stores"
              className="flex flex-col items-center group transition-transform active:scale-95"
              title="Find Nearby Stores"
              aria-label="Stores"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-100/90 text-sky-600 group-hover:bg-sky-200 flex items-center justify-center transition-all shadow-xs">
                <MaterialIcon name="location_on" size="md" className="text-sky-600" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-700 tracking-tight mt-0.5 group-hover:text-black">
                Stores
              </span>
            </Link>

            {/* 2. Wishlist (Soft Pink) */}
            <Link
              href="/wishlist"
              className="flex flex-col items-center group relative transition-transform active:scale-95"
              title="Saved Wishlist"
              aria-label="Wishlist"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-100/90 text-rose-600 group-hover:bg-rose-200 flex items-center justify-center relative transition-all shadow-xs">
                <MaterialIcon name="favorite" size="md" className="text-rose-600" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[9px] font-black h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-700 tracking-tight mt-0.5 group-hover:text-black">
                Wishlist
              </span>
            </Link>

            {/* 3. Bag / Cart (Soft Purple) */}
            <Link
              href="/cart"
              className="flex flex-col items-center group relative transition-transform active:scale-95"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-100/90 text-purple-600 group-hover:bg-purple-200 flex items-center justify-center relative transition-all shadow-xs">
                <MaterialIcon name="shopping_bag" size="md" className="text-purple-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-black h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-700 tracking-tight mt-0.5 group-hover:text-black">
                Bag
              </span>
            </Link>

            {/* 4. Account / Avatar */}
            <Link
              href={session?.user ? "/profile" : "/login"}
              className="flex items-center gap-1.5 group pl-1 transition-transform active:scale-95"
              title={session?.user ? "My Profile" : "Sign In"}
              aria-label="User Account"
            >
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-rose-300 ring-2 ring-rose-100 bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : session?.user?.name ? (
                    <span className="font-mono text-xs font-black uppercase text-white">
                      {session.user.name.charAt(0)}
                    </span>
                  ) : (
                    <div className="w-full h-full bg-rose-100/90 text-rose-600 flex items-center justify-center">
                      <MaterialIcon name="person" size="md" />
                    </div>
                  )}
                </div>
                <div className="xl:hidden">
                  <span className="text-[10px] font-bold text-neutral-700 tracking-tight mt-0.5 group-hover:text-black">
                    {session?.user ? "Account" : "Sign In"}
                  </span>
                </div>
              </div>

              {/* Desktop Greeting & Dropdown Chevron */}
              <div className="hidden xl:flex items-center gap-0.5">
                <span className="text-xs font-bold text-neutral-800 group-hover:text-black truncate max-w-[90px]">
                  {session?.user?.name ? `Hi, ${session.user.name.split(" ")[0]}` : "Sign In"}
                </span>
                <MaterialIcon name="expand_more" size="xs" className="text-neutral-500 group-hover:text-black" />
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="pb-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <MaterialIcon
              name="search"
              size="sm"
              className="absolute left-3.5 top-2.5 text-neutral-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search products or stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F3F4F6] border border-neutral-200/80 rounded-full py-2 pl-10 pr-4 text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </form>
        </div>
      </Container>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-5 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3">
            {NAVIGATION_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs font-black tracking-wider uppercase text-neutral-900 py-2.5 border-b border-neutral-100 flex items-center justify-between"
              >
                <span>{link.name}</span>
                <MaterialIcon name="chevron_right" size="sm" className="text-neutral-400" />
              </Link>
            ))}
            <Link
              href="/stores"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-xs font-black tracking-wider uppercase text-neutral-900 py-2.5 border-b border-neutral-100"
            >
              <span className="flex items-center gap-2">
                <MaterialIcon name="location_on" size="sm" className="text-sky-600" />
                Store Locator
              </span>
              <MaterialIcon name="chevron_right" size="sm" className="text-neutral-400" />
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-xs font-black tracking-wider uppercase text-neutral-900 py-2.5 border-b border-neutral-100"
            >
              <span className="flex items-center gap-2">
                <MaterialIcon name="inventory_2" size="sm" className="text-purple-600" />
                My Orders
              </span>
              <MaterialIcon name="chevron_right" size="sm" className="text-neutral-400" />
            </Link>
            <Link
              href={session?.user ? "/profile" : "/login"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-xs font-black tracking-wider uppercase text-neutral-900 py-2.5 border-b border-neutral-100"
            >
              <span className="flex items-center gap-2">
                {session?.user?.image ? (
                  <div className="w-5 h-5 rounded-full overflow-hidden relative border border-neutral-300 bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="font-mono text-[9px] font-bold uppercase select-none">
                      {(session.user.name || "U").charAt(0)}
                    </span>
                  </div>
                ) : (
                  <MaterialIcon name="person" size="sm" className="text-rose-600" />
                )}
                {session?.user ? `My Profile (${session.user.name?.split(" ")[0]})` : "Sign In"}
              </span>
              <MaterialIcon name="chevron_right" size="sm" className="text-neutral-400" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
