"use client";

import React, { useEffect, useState, useRef } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const STORAGE_KEY = "zudio_concept_notice_accepted";

export const ImportantNoticeModal: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasDeclined, setHasDeclined] = useState(false);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      const accepted = sessionStorage.getItem(STORAGE_KEY);
      if (!accepted) {
        setIsOpen(true);
      }
    } catch {
      // Fallback in case storage access is restricted
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isClosing) {
      document.body.style.overflow = "hidden";

      // Focus primary button for accessibility
      const timer = setTimeout(() => {
        primaryButtonRef.current?.focus();
      }, 100);

      // Prevent escape key from bypassing the mandatory notice
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, isClosing]);

  const handleAccept = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
      // Ensure no residual localStorage key exists
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage write error ignored
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      document.body.style.overflow = "";
    }, 250);
  };

  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "https://www.google.com";
      }
      // Show exit confirmation screen if history navigation doesn't unmount the page
      setTimeout(() => {
        setHasDeclined(true);
      }, 300);
    }
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="important-notice-title"
      aria-describedby="important-notice-desc"
      className={`fixed inset-0 z-[99990] bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto transition-opacity duration-250 ease-out ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className={`relative w-full max-w-xl md:max-w-[620px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 md:p-8 text-neutral-900 my-auto border border-neutral-100 max-h-[92vh] overflow-y-auto scrollbar-thin transition-transform duration-250 ease-out ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {hasDeclined ? (
          /* Declined Exit State */
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center mx-auto">
              <MaterialIcon name="logout" size="lg" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">
              Access Not Entered
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
              You chose not to enter this independent concept demonstration. You can safely close this browser window or tab.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setHasDeclined(false)}
                className="text-xs font-bold text-neutral-900 underline underline-offset-4 hover:text-neutral-700 cursor-pointer"
              >
                Review Notice Again
              </button>
            </div>
          </div>
        ) : (
          /* Main Notice Content */
          <>
            {/* Top Warning Badge */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                <MaterialIcon name="warning" size="lg" filled />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-5 sm:mb-6">
              <h2
                id="important-notice-title"
                className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-950"
              >
                IMPORTANT NOTICE
              </h2>
              <p
                id="important-notice-desc"
                className="text-xs sm:text-[13px] font-bold text-rose-600 mt-1"
              >
                This is an Independent Concept Demo — Not an Official Zudio Website
              </p>
            </div>

            {/* 5 Information Sections */}
            <div className="space-y-3.5 sm:space-y-4">
              {/* 1. Independent Project */}
              <div className="flex items-start gap-3 sm:gap-3.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MaterialIcon name="person" size="sm" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-950 leading-tight">
                    Independent Project
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed mt-0.5">
                    This website is an independently developed technology concept and demonstration prototype created by Sujal Verma to explore how digital commerce could be connected with physical retail stores.
                  </p>
                </div>
              </div>

              {/* 2. Not Affiliated with Zudio / Trent */}
              <div className="flex items-start gap-3 sm:gap-3.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MaterialIcon name="account_balance" size="sm" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-950 leading-tight">
                    Not Affiliated with Zudio / Trent
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed mt-0.5">
                    This website is NOT owned, operated, sponsored, endorsed, or officially affiliated with Zudio or Trent Limited.
                  </p>
                </div>
              </div>

              {/* 3. Brand Assets */}
              <div className="flex items-start gap-3 sm:gap-3.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MaterialIcon name="copyright" size="sm" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-950 leading-tight">
                    Brand Assets
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed mt-0.5">
                    The Zudio name, logo, brand identity, and other related trademarks/assets belong to their respective owners and are used here solely for the purpose of demonstrating this independent concept.
                  </p>
                </div>
              </div>

              {/* 4. Demo Data Only */}
              <div className="flex items-start gap-3 sm:gap-3.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MaterialIcon name="database" size="sm" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-950 leading-tight">
                    Demo Data Only
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed mt-0.5">
                    This prototype does not use Zudio/Trent&apos;s internal systems, proprietary data, or live inventory. Product, store, and inventory information shown on this website is for demonstration purposes only.
                  </p>
                </div>
              </div>

              {/* 5. Response from Zudio */}
              <div className="flex items-start gap-3 sm:gap-3.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MaterialIcon name="mail" size="sm" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-950 leading-tight">
                    Response from Zudio
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed mt-0.5">
                    I previously shared this concept with Zudio/Trent for consideration. Their response stated that they would not be able to partner with me at this time.
                  </p>
                  {/* Email Quote Callout Box */}
                  <div className="bg-rose-50/70 border-l-[3.5px] border-rose-400 rounded-r-lg p-2.5 sm:p-3 mt-2">
                    <p className="text-[11px] sm:text-xs italic text-neutral-700 leading-snug">
                      &ldquo;Thank you for reaching out to us. Unfortunately, we will not be able to partner with you at this time.&rdquo;
                    </p>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 mt-1 block">
                      — Team Zudio (Email, 6 Sep 2026)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer Sentence */}
            <p className="text-[11px] sm:text-xs text-neutral-500 text-center max-w-lg mx-auto pt-4 pb-2 leading-relaxed">
              By continuing, you acknowledge that you are viewing an independent technology demonstration and not the official Zudio website.
            </p>

            {/* Buttons */}
            <div className="space-y-2 pt-2">
              <button
                ref={primaryButtonRef}
                onClick={handleAccept}
                className="w-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.008] active:scale-[0.99] cursor-pointer"
              >
                <span>I Understand &amp; Continue to Demo</span>
                <MaterialIcon name="arrow_forward" size="sm" />
              </button>

              <button
                onClick={handleGoBack}
                className="w-full bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 font-bold text-xs sm:text-sm py-2.5 sm:py-3 px-6 rounded-xl transition-all active:scale-[0.99] cursor-pointer"
              >
                Go Back
              </button>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 sm:pt-4 border-t border-neutral-100 mt-3 sm:mt-4">
              <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">
                © 2026 Sujal Verma · Independent Technology Concept
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportantNoticeModal;
