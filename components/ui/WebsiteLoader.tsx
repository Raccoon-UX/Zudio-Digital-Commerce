"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ZudioWordmark } from "@/components/ui/ZudioWordmark";

export const WebsiteLoader: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Disable body scroll while loader is active
    document.body.style.overflow = "hidden";

    const duration = 1400; // total animation time in ms
    const intervalTime = 25;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step + (Math.random() * 2 - 0.5);
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsCompleted(true);
            setTimeout(() => {
              setIsVisible(false);
              document.body.style.overflow = "";
            }, 500);
          }, 150);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col justify-between bg-[#f8f9fa] text-neutral-900 select-none overflow-hidden transition-all duration-500 ease-out ${
        isCompleted ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      aria-hidden={isCompleted}
    >
      {/* 1. Subtle Watermark in Background */}
      <div className="absolute inset-x-0 bottom-[-4vw] flex justify-center pointer-events-none z-0 opacity-30 select-none">
        <span className="text-[18vw] font-black uppercase tracking-tighter text-neutral-200/80 leading-none font-['Michroma','Unbounded',sans-serif]">
          ZUDIO
        </span>
      </div>

      {/* 2. Left Angled Editorial Card (Desktop / Tablet) */}
      <div className="hidden lg:block absolute -left-12 bottom-0 w-80 h-[85%] z-10 pointer-events-none transform -rotate-3 origin-bottom-left transition-transform duration-1000 ease-out">
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-neutral-950">
          <Image
            src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=1200&auto=format&fit=crop"
            alt="Zudio Store"
            fill
            className="object-cover opacity-60 grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute top-8 left-6">
            <ZudioWordmark size="sm" variant="light" className="h-6 w-auto opacity-90" />
          </div>
          <div className="absolute bottom-8 left-6 right-6">
            <p className="text-xl font-black uppercase tracking-tight text-white leading-tight">
              FASHION<br />
              MAKES<br />
              A BRIGHTER<br />
              YOU
            </p>
          </div>
        </div>
      </div>

      {/* 3. Right Angled Editorial Card (Desktop / Tablet) */}
      <div className="hidden lg:block absolute -right-12 top-10 w-80 h-[82%] z-10 pointer-events-none transform rotate-3 origin-top-right transition-transform duration-1000 ease-out">
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-neutral-900">
          <Image
            src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=1200&auto=format&fit=crop"
            alt="Everyday Fashion"
            fill
            className="object-cover opacity-50 grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/80" />
          <div className="absolute top-10 left-8 right-6">
            <p className="text-xl font-black uppercase tracking-tight text-white leading-tight">
              SIMPLE<br />
              STYLES<br />
              BIGGER<br />
              STORIES
            </p>
            <div className="w-8 h-[2px] bg-white/70 mt-3" />
          </div>
        </div>
      </div>

      {/* 4. Top Editorial Accents */}
      <div className="relative z-20 w-full px-6 sm:px-12 pt-6 sm:pt-8 flex justify-between items-start">
        {/* Top Left */}
        <div className="space-y-1">
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-neutral-500 uppercase leading-relaxed">
            FASHION<br />
            FOR<br />
            EVERYDAY
          </p>
          <div className="w-5 h-[1.5px] bg-neutral-900 mt-2" />
        </div>

        {/* Top Right */}
        <div className="text-right space-y-1">
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-neutral-600 uppercase leading-relaxed">
            WOMEN<br />
            MEN<br />
            KIDS<br />
            LIFESTYLE
          </p>
          <div className="w-5 h-[1.5px] bg-neutral-900 mt-2 ml-auto" />
        </div>
      </div>

      {/* 5. Center Section — Logo, Tagline, Animated Progress Bar */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 -mt-4">
        {/* Official Geometric Zudio Wordmark */}
        <div className="flex items-center justify-center mb-1">
          <ZudioWordmark size="xl" variant="dark" className="h-12 sm:h-16 md:h-20 w-auto" />
        </div>

        {/* Brand Tagline */}
        <p className="text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.38em] text-neutral-800 uppercase mt-2 sm:mt-3">
          GOOD FASHION &nbsp;•&nbsp; BRIGHTER DAYS
        </p>

        {/* Progress Bar Container */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center w-full max-w-[280px] sm:max-w-sm">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-2 sm:h-2.5 bg-neutral-200/90 rounded-full overflow-hidden p-[1px] shadow-inner">
              <div
                className="h-full bg-neutral-950 rounded-full transition-all duration-75 ease-out shadow-sm"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-neutral-700 tabular-nums w-10 text-right">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Loading status label */}
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.28em] text-neutral-500 uppercase mt-3">
            LOADING YOUR STYLE...
          </p>
        </div>
      </div>

      {/* 6. Bottom Section — 4 Highlight Badges + Bottom Right Credits */}
      <div className="relative z-20 w-full px-4 sm:px-12 pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="hidden sm:block w-24 text-[9px] font-medium tracking-[0.2em] text-neutral-400 uppercase">
          {/* Spacer */}
        </div>

        {/* 4 Brand Pillars (Bottom Center) */}
        <div className="flex items-center justify-center gap-2 sm:gap-5 md:gap-8 flex-wrap">
          {/* 1. Trending Styles */}
          <div className="flex flex-col items-center gap-1.5 text-neutral-700">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
            </svg>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase whitespace-nowrap">
              TRENDING STYLES
            </span>
          </div>

          <div className="h-5 w-[1px] bg-neutral-300 hidden xs:block" />

          {/* 2. Better Value */}
          <div className="flex flex-col items-center gap-1.5 text-neutral-700">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase whitespace-nowrap">
              BETTER VALUE
            </span>
          </div>

          <div className="h-5 w-[1px] bg-neutral-300 hidden xs:block" />

          {/* 3. Everyday Fashion */}
          <div className="flex flex-col items-center gap-1.5 text-neutral-700">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase whitespace-nowrap">
              EVERYDAY FASHION
            </span>
          </div>

          <div className="h-5 w-[1px] bg-neutral-300 hidden xs:block" />

          {/* 4. A Brighter You */}
          <div className="flex flex-col items-center gap-1.5 text-neutral-700">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" x2="9.01" y1="9" y2="9" />
              <line x1="15" x2="15.01" y1="9" y2="9" />
            </svg>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase whitespace-nowrap">
              A BRIGHTER YOU
            </span>
          </div>
        </div>

        {/* Bottom Right Credits */}
        <div className="text-right">
          <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase leading-tight">
            EST. FOR<br />
            A BRIGHTER<br />
            TOMORROW
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebsiteLoader;
