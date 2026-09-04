"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { APP_CONFIG, FOOTER_LINKS } from "@/lib/constants";
import { ZudioLogo } from "./ZudioLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stitch-primary text-white border-t border-neutral-800 font-sans">
      {/* Brand Value Pillars */}
      <div className="border-b border-neutral-800 py-8">
        <Container size="xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3.5">
              <MaterialIcon name="local_shipping" size="lg" className="text-neutral-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Fast Home Delivery
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Convenient doorstep delivery
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3.5">
              <MaterialIcon name="store" size="lg" className="text-neutral-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Store Pickup & Reserve
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Check store stock & reserve
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3.5">
              <MaterialIcon name="refresh" size="lg" className="text-neutral-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Hassle-free Returns
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Easy store & home returns
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3.5">
              <MaterialIcon name="verified" size="lg" className="text-neutral-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  100% Genuine Quality
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Everyday fashion at great value
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Footer Links */}
      <div className="py-12 md:py-16">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
            {/* Brand Column */}
            <div className="md:col-span-4 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2">
                <ZudioLogo variant="light" className="w-[104px] h-auto text-white" />
                <span className="text-[9px] tracking-widest uppercase bg-neutral-800 text-neutral-300 px-1.5 py-0.5 border border-neutral-700 rounded-sm">
                  PILOT
                </span>
              </Link>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                Effortless style for everyday life. Shop the latest trends in high-street fashion with uncompromised quality and unbeatable value.
              </p>
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-sm">
                <p className="text-[11px] text-neutral-400 leading-normal">
                  <strong className="text-neutral-200">Concept Disclaimer:</strong>{" "}
                  {APP_CONFIG.disclaimer}
                </p>
              </div>
            </div>

            {/* Shop Links */}
            <div className="md:col-span-3 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                Shop Collections
              </h5>
              <ul className="space-y-2 text-xs text-neutral-400">
                {FOOTER_LINKS.shop.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Store & Services */}
            <div className="md:col-span-2 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                Stores & Help
              </h5>
              <ul className="space-y-2 text-xs text-neutral-400">
                {FOOTER_LINKS.services.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className="md:col-span-3 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                Newsletter
              </h5>
              <p className="text-xs text-neutral-400">
                Subscribe for new drop alerts, exclusive seasonal collections, and pilot updates.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); alert("Thank you for subscribing!"); }} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white flex-1"
                />
                <button
                  type="submit"
                  className="bg-white text-stitch-primary hover:bg-neutral-200 font-bold uppercase tracking-wider text-[11px] px-4 py-2 rounded transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} Zudio Digital Commerce Concept Pilot. All rights reserved.</p>
            <p className="text-[11px] text-neutral-500">
              Modern high-street fashion e-commerce experience.
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
