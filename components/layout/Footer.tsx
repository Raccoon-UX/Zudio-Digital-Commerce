import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { APP_CONFIG, FOOTER_LINKS } from "@/lib/constants";
import { MapPin, ShieldCheck, RefreshCw, Truck } from "lucide-react";
import { ZudioLogo } from "./ZudioLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-950 text-white border-t border-neutral-800">
      {/* Brand Value Pillars */}
      <div className="border-b border-neutral-800 py-8">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Truck className="h-6 w-6 text-neutral-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Fast Home Delivery
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Convenient doorstep delivery
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <MapPin className="h-6 w-6 text-neutral-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Store Pickup & Reserve
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Check store stock & reserve
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <RefreshCw className="h-6 w-6 text-neutral-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Hassle-free Returns
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Easy store & home returns
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <ShieldCheck className="h-6 w-6 text-neutral-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  100% Genuine Quality
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Brand column */}
            <div className="md:col-span-4 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2">
                <ZudioLogo variant="light" className="w-[110px] h-auto" />
                <span className="text-[10px] tracking-widest uppercase bg-neutral-800 text-neutral-300 px-1.5 py-0.5 border border-neutral-700">
                  PILOT
                </span>
              </Link>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                {APP_CONFIG.tagline}
              </p>
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-none">
                <p className="text-[11px] text-neutral-400 leading-normal">
                  <strong className="text-neutral-200">Prototype Disclaimer:</strong>{" "}
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
            <div className="md:col-span-3 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                Stores & Services
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

            {/* Account & Administration */}
            <div className="md:col-span-2 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                Account & Ops
              </h5>
              <ul className="space-y-2 text-xs text-neutral-400">
                {FOOTER_LINKS.account.map((link) => (
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
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} Zudio Digital Commerce Concept Pilot. All rights reserved.</p>
            <p className="text-[11px] text-neutral-500">
              Built as a modular monolith Next.js prototype.
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
