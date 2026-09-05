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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stitch-border shadow-[0_2px_12px_rgba(0,0,0,0.03)] font-sans">
      {/* Top Notification / Promo Banner */}
      <div className="bg-stitch-primary text-white text-[10px] sm:text-xs py-1.5 text-center px-4 tracking-wider uppercase select-none">
        <span className="font-bold">{APP_CONFIG.disclaimer}</span>
        <span className="hidden sm:inline text-neutral-300"> | Free standard delivery on orders above ₹{APP_CONFIG.freeDeliveryThreshold}</span>
      </div>

      <Container size="xl">
        <div className="flex items-center justify-between h-16 md:h-18 gap-4 sm:gap-6">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-stitch-primary hover:text-neutral-600 transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <MaterialIcon name={isMobileMenuOpen ? "close" : "menu"} size="lg" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group" aria-label="Zudio Home">
            <ZudioLogo className="w-[88px] sm:w-[96px] h-auto text-stitch-primary" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAVIGATION_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "text-xs font-bold tracking-[0.14em] uppercase transition-colors py-2 border-b-2",
                    isActive
                      ? "text-stitch-primary border-stitch-primary"
                      : "text-stitch-secondaryText border-transparent hover:text-stitch-primary"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-[280px] xl:max-w-[340px] w-full">
            <input
              type="text"
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stitch-muted border border-stitch-border rounded py-2 pl-3.5 pr-9 text-xs text-stitch-primary placeholder:text-stitch-secondaryText focus:outline-none focus:border-stitch-primary transition-colors"
            />
            <button type="submit" className="absolute right-2.5 text-neutral-500 hover:text-stitch-primary transition-colors" aria-label="Search">
              <MaterialIcon name="search" size="sm" />
            </button>
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4 text-stitch-primary">
            {/* Store Locator Link */}
            <Link
              href="/stores"
              className="p-1.5 hover:text-neutral-600 hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors"
              title="Find Nearby Store"
            >
              <MaterialIcon name="location_on" size="md" />
              <span className="hidden xl:inline">Stores</span>
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="p-1.5 hover:text-neutral-600 relative transition-colors"
              title="Saved Wishlist"
              aria-label="Wishlist"
            >
              <MaterialIcon name="favorite" size="md" className={wishlistCount > 0 ? "text-rose-600" : ""} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-stitch-primary text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag / Cart Link */}
            <Link
              href="/cart"
              className="p-1.5 hover:text-neutral-600 relative transition-colors"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <MaterialIcon name="shopping_bag" size="md" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-stitch-primary text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Profile */}
            <Link
              href={session?.user ? "/profile" : "/login"}
              className="p-1.5 hover:text-neutral-600 flex items-center gap-1.5 transition-colors"
              title={session?.user ? "My Profile" : "Sign In"}
              aria-label="User Account"
            >
              <MaterialIcon name="person" size="md" />
              {session?.user && (
                <span className="hidden xl:inline text-xs font-bold uppercase truncate max-w-[80px]">
                  {session.user.name?.split(" ")[0]}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="pb-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products or stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stitch-muted border border-stitch-border rounded py-2 pl-3.5 pr-9 text-xs text-stitch-primary focus:outline-none focus:border-stitch-primary"
            />
            <button type="submit" className="absolute right-2.5 top-2 text-neutral-500" aria-label="Search">
              <MaterialIcon name="search" size="sm" />
            </button>
          </form>
        </div>
      </Container>

      {/* Mobile Menu Slide-Over / Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stitch-border bg-white px-5 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3">
            {NAVIGATION_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs font-bold tracking-wider uppercase text-stitch-primary py-2 border-b border-stitch-border flex items-center justify-between"
              >
                <span>{link.name}</span>
                <MaterialIcon name="chevron_right" size="sm" className="text-neutral-400" />
              </Link>
            ))}
            <Link
              href="/stores"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-xs font-bold tracking-wider uppercase text-stitch-primary py-2 border-b border-stitch-border"
            >
              <span className="flex items-center gap-2">
                <MaterialIcon name="location_on" size="sm" />
                Store Locator
              </span>
              <MaterialIcon name="chevron_right" size="sm" className="text-neutral-400" />
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-xs font-bold tracking-wider uppercase text-stitch-primary py-2 border-b border-stitch-border"
            >
              <span className="flex items-center gap-2">
                <MaterialIcon name="inventory_2" size="sm" />
                My Orders
              </span>
              <MaterialIcon name="chevron_right" size="sm" className="text-neutral-400" />
            </Link>
            <Link
              href={session?.user ? "/profile" : "/login"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-xs font-bold tracking-wider uppercase text-stitch-primary py-2 border-b border-stitch-border"
            >
              <span className="flex items-center gap-2">
                <MaterialIcon name="person" size="sm" />
                {session?.user ? "My Profile" : "Sign In"}
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
