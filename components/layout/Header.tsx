"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  MapPin,
  Search,
  Menu,
  X,
  Package,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { NAVIGATION_LINKS, APP_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Header: React.FC = () => {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const pathname = usePathname();

  // Polling / fetching cart & wishlist counts
  useEffect(() => {
    const fetchCounters = () => {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setCartCount(data.data.itemCount || 0);
          }
        })
        .catch(() => {});

      if (session?.user) {
        fetch("/api/wishlist")
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setWishlistCount(data.data.count || 0);
            }
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
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      {/* Top Banner */}
      <div className="bg-black text-white text-xs py-1.5 text-center px-4 tracking-wider uppercase">
        <span className="font-semibold">{APP_CONFIG.disclaimer}</span>
        <span className="hidden sm:inline"> | Free standard delivery on orders above ₹{APP_CONFIG.freeDeliveryThreshold}</span>
      </div>

      {/* Main Navbar */}
      <Container size="xl">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-neutral-800 hover:text-black focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-black font-sans">
              ZUDIO
            </span>
            <span className="text-[10px] tracking-widest uppercase bg-neutral-100 text-neutral-600 px-1.5 py-0.5 border border-neutral-300 hidden sm:inline-block">
              PILOT
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {NAVIGATION_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "text-sm font-semibold tracking-wider uppercase transition-colors hover:text-black py-2",
                    isActive
                      ? "text-black border-b-2 border-black"
                      : "text-neutral-600"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Search bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center relative max-w-xs w-full"
          >
            <input
              type="text"
              placeholder="Search fashion, styles, stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 py-1.5 pl-3 pr-9 text-xs placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 text-neutral-400 hover:text-black"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Utility Action Icons */}
          <div className="flex items-center space-x-4 md:space-x-5 text-neutral-800">
            {/* Store Locator Link */}
            <Link
              href="/stores"
              className="p-1 hover:text-black transition-colors hidden sm:flex items-center gap-1 text-xs font-medium uppercase tracking-wider"
              title="Find Store"
            >
              <MapPin className="h-5 w-5" />
              <span className="hidden xl:inline">Stores</span>
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="p-1 hover:text-black transition-colors relative"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link
              href="/cart"
              className="p-1 hover:text-black transition-colors relative"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Profile Link */}
            <Link
              href={session?.user ? "/profile" : "/login"}
              className="p-1 hover:text-black transition-colors flex items-center gap-1.5"
              title={session?.user ? "My Profile" : "Sign In"}
              aria-label="Account"
            >
              <UserIcon className="h-5 w-5" />
              {session?.user && (
                <span className="hidden xl:inline text-xs font-bold uppercase truncate max-w-[80px]">
                  {session.user.name?.split(" ")[0]}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products or stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-100 border border-neutral-200 py-2 pl-3 pr-9 text-xs placeholder:text-neutral-500 focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-black"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      </Container>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-6 space-y-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3">
            {NAVIGATION_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium tracking-wide uppercase text-neutral-900 hover:text-black py-1 border-b border-neutral-100"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/stores"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-base font-medium tracking-wide uppercase text-neutral-900 hover:text-black py-1 border-b border-neutral-100"
            >
              <MapPin className="h-4 w-4" />
              <span>Store Locator</span>
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-base font-medium tracking-wide uppercase text-neutral-900 hover:text-black py-1 border-b border-neutral-100"
            >
              <Package className="h-4 w-4" />
              <span>My Orders</span>
            </Link>
            <Link
              href={session?.user ? "/profile" : "/login"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-base font-medium tracking-wide uppercase text-neutral-900 hover:text-black py-1 border-b border-neutral-100"
            >
              <UserIcon className="h-4 w-4" />
              <span>{session?.user ? "My Profile" : "Sign In"}</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
