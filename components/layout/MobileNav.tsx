"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { cn } from "@/lib/utils";

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", iconName: "home" },
    { name: "Shop", href: "/products", iconName: "grid_view" },
    { name: "Stores", href: "/stores", iconName: "location_on" },
    { name: "Wishlist", href: "/wishlist", iconName: "favorite" },
    { name: "Bag", href: "/cart", iconName: "shopping_bag" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stitch-border px-2 py-1.5 safe-area-pb font-sans">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 min-w-[54px] text-[10px] font-bold uppercase tracking-wider transition-colors select-none",
                isActive
                  ? "text-stitch-primary"
                  : "text-stitch-secondaryText hover:text-stitch-primary"
              )}
            >
              <MaterialIcon
                name={item.iconName}
                size="md"
                filled={isActive}
                className={cn("mb-0.5", isActive ? "text-stitch-primary" : "text-stitch-secondaryText")}
              />
              <span className={isActive ? "font-black" : "font-medium"}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
