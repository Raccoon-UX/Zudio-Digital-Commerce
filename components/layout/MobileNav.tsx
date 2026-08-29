"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, MapPin, Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/products", icon: Grid },
    { name: "Stores", href: "/stores", icon: MapPin },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "Cart", href: "/cart", icon: ShoppingBag },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-[10px] font-medium tracking-tight transition-colors",
                isActive ? "text-black font-bold" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mb-0.5",
                  isActive ? "text-black stroke-[2.25]" : "text-neutral-500 stroke-[1.75]"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
