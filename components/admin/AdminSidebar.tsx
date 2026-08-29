"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  Store,
  Users,
  History,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Store Inventory Matrix", href: "/admin/inventory", icon: Boxes },
    { label: "Order Management", href: "/admin/orders", icon: ShoppingBag },
    { label: "Customer & Roles", href: "/admin/customers", icon: Users },
    { label: "Activity Audit Logs", href: "/admin/audit-logs", icon: History },
  ];

  return (
    <aside className="w-64 bg-black text-white min-h-screen p-6 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">
            Zudio Enterprise
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">
            Admin Console
          </h2>
        </div>

        <nav className="space-y-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-none font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-white text-black font-black"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Store View Link */}
      <div className="pt-6 border-t border-neutral-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <span>View Customer Storefront</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/staff/reservations"
          target="_blank"
          className="flex items-center justify-between text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <span>POS Staff Portal</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
