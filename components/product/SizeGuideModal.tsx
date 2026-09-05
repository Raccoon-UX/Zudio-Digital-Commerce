"use client";

import React, { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Button } from "@/components/ui/Button";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

type Unit = "in" | "cm";

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  category = "Men",
}) => {
  const [unit, setUnit] = useState<Unit>("in");

  if (!isOpen) return null;

  const normalizedCategory = category.toLowerCase();
  const isFootwear = normalizedCategory.includes("footwear") || normalizedCategory.includes("shoe");
  const isKids = normalizedCategory.includes("kid") || normalizedCategory.includes("child") || normalizedCategory.includes("boy") || normalizedCategory.includes("girl");
  const isWomen = normalizedCategory.includes("women") || normalizedCategory.includes("ladies");

  const menSizes = [
    {
      size: "XS",
      chest: unit === "in" ? '34" - 36"' : "86 - 91 cm",
      waist: unit === "in" ? '28" - 30"' : "71 - 76 cm",
      length: unit === "in" ? '26.5"' : "67 cm",
    },
    {
      size: "S",
      chest: unit === "in" ? '36" - 38"' : "91 - 96 cm",
      waist: unit === "in" ? '30" - 32"' : "76 - 81 cm",
      length: unit === "in" ? '27.5"' : "70 cm",
    },
    {
      size: "M",
      chest: unit === "in" ? '38" - 40"' : "96 - 101 cm",
      waist: unit === "in" ? '32" - 34"' : "81 - 86 cm",
      length: unit === "in" ? '28.5"' : "72 cm",
    },
    {
      size: "L",
      chest: unit === "in" ? '40" - 42"' : "101 - 106 cm",
      waist: unit === "in" ? '34" - 36"' : "86 - 91 cm",
      length: unit === "in" ? '29.5"' : "75 cm",
    },
    {
      size: "XL",
      chest: unit === "in" ? '42" - 44"' : "106 - 112 cm",
      waist: unit === "in" ? '36" - 38"' : "91 - 96 cm",
      length: unit === "in" ? '30.5"' : "77 cm",
    },
    {
      size: "XXL",
      chest: unit === "in" ? '44" - 46"' : "112 - 117 cm",
      waist: unit === "in" ? '38" - 40"' : "96 - 101 cm",
      length: unit === "in" ? '31.5"' : "80 cm",
    },
  ];

  const womenSizes = [
    {
      size: "XS",
      bust: unit === "in" ? '31" - 33"' : "79 - 84 cm",
      waist: unit === "in" ? '24" - 26"' : "61 - 66 cm",
      hip: unit === "in" ? '34" - 36"' : "86 - 91 cm",
    },
    {
      size: "S",
      bust: unit === "in" ? '33" - 35"' : "84 - 89 cm",
      waist: unit === "in" ? '26" - 28"' : "66 - 71 cm",
      hip: unit === "in" ? '36" - 38"' : "91 - 96 cm",
    },
    {
      size: "M",
      bust: unit === "in" ? '35" - 37"' : "89 - 94 cm",
      waist: unit === "in" ? '28" - 30"' : "71 - 76 cm",
      hip: unit === "in" ? '38" - 40"' : "96 - 101 cm",
    },
    {
      size: "L",
      bust: unit === "in" ? '37" - 40"' : "94 - 101 cm",
      waist: unit === "in" ? '30" - 33"' : "76 - 84 cm",
      hip: unit === "in" ? '40" - 43"' : "101 - 109 cm",
    },
    {
      size: "XL",
      bust: unit === "in" ? '40" - 43"' : "101 - 109 cm",
      waist: unit === "in" ? '33" - 36"' : "84 - 91 cm",
      hip: unit === "in" ? '43" - 46"' : "109 - 117 cm",
    },
    {
      size: "XXL",
      bust: unit === "in" ? '43" - 46"' : "109 - 117 cm",
      waist: unit === "in" ? '36" - 39"' : "91 - 99 cm",
      hip: unit === "in" ? '46" - 49"' : "117 - 124 cm",
    },
  ];

  const kidsSizes = [
    {
      size: "3-4Y",
      height: unit === "in" ? '39" - 41"' : "98 - 104 cm",
      chest: unit === "in" ? '21" - 22"' : "53 - 56 cm",
      waist: unit === "in" ? '20" - 21"' : "51 - 53 cm",
    },
    {
      size: "5-6Y",
      height: unit === "in" ? '43" - 46"' : "110 - 116 cm",
      chest: unit === "in" ? '23" - 24"' : "58 - 61 cm",
      waist: unit === "in" ? '21" - 22"' : "53 - 56 cm",
    },
    {
      size: "7-8Y",
      height: unit === "in" ? '48" - 50"' : "122 - 128 cm",
      chest: unit === "in" ? '25" - 26"' : "63 - 66 cm",
      waist: unit === "in" ? '22" - 23"' : "56 - 58 cm",
    },
    {
      size: "9-10Y",
      height: unit === "in" ? '53" - 55"' : "134 - 140 cm",
      chest: unit === "in" ? '27" - 28"' : "68 - 71 cm",
      waist: unit === "in" ? '24" - 25"' : "61 - 63 cm",
    },
    {
      size: "11-12Y",
      height: unit === "in" ? '57" - 60"' : "146 - 152 cm",
      chest: unit === "in" ? '29" - 31"' : "73 - 78 cm",
      waist: unit === "in" ? '25" - 26"' : "63 - 66 cm",
    },
  ];

  const footwearSizes = [
    { uk: "UK 6", us: "US 7", eu: "EU 40", footLength: unit === "in" ? '9.6"' : "24.5 cm" },
    { uk: "UK 7", us: "US 8", eu: "EU 41", footLength: unit === "in" ? '10.0"' : "25.4 cm" },
    { uk: "UK 8", us: "US 9", eu: "EU 42", footLength: unit === "in" ? '10.3"' : "26.2 cm" },
    { uk: "UK 9", us: "US 10", eu: "EU 43", footLength: unit === "in" ? '10.7"' : "27.1 cm" },
    { uk: "UK 10", us: "US 11", eu: "EU 44", footLength: unit === "in" ? '11.0"' : "27.9 cm" },
    { uk: "UK 11", us: "US 12", eu: "EU 45", footLength: unit === "in" ? '11.3"' : "28.7 cm" },
  ];

  const getTitle = () => {
    if (isFootwear) return "Footwear Size Guide";
    if (isKids) return "Kids' Apparel Size Guide";
    if (isWomen) return "Women's Apparel Size Guide";
    return "Men's Apparel Size Guide";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Heavy Opaque Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card - 100% Solid Opaque Surface */}
      <div className="relative w-full max-w-lg bg-white border border-neutral-300 p-5 sm:p-6 rounded-md shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <MaterialIcon name="straighten" size="sm" className="text-neutral-900" />
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-neutral-900">
              {getTitle()}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 flex items-center justify-center transition-colors"
            aria-label="Close size guide"
          >
            <MaterialIcon name="close" size="sm" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <p className="text-xs text-neutral-600 leading-relaxed max-w-xs">
              All measurements are taken flat. For a relaxed or oversized fit, choose your regular size.
            </p>

            {/* Unit Switcher */}
            <div className="inline-flex items-center bg-neutral-100 p-0.5 rounded border border-neutral-200 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setUnit("in")}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded transition-colors ${
                  unit === "in"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Inches
              </button>
              <button
                type="button"
                onClick={() => setUnit("cm")}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded transition-colors ${
                  unit === "cm"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                CM
              </button>
            </div>
          </div>

          {/* Size Guide Table with 100% Opaque Solid Surfaces */}
          <div className="overflow-x-auto border border-neutral-200 rounded bg-white shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100 uppercase tracking-wider text-[10px] font-bold text-neutral-900 border-b border-neutral-200">
                {isFootwear ? (
                  <tr>
                    <th className="py-2.5 px-3">UK Size</th>
                    <th className="py-2.5 px-3">US Size</th>
                    <th className="py-2.5 px-3">EU Size</th>
                    <th className="py-2.5 px-3">Foot Length ({unit})</th>
                  </tr>
                ) : isKids ? (
                  <tr>
                    <th className="py-2.5 px-3">Age Size</th>
                    <th className="py-2.5 px-3">Height ({unit})</th>
                    <th className="py-2.5 px-3">Chest ({unit})</th>
                    <th className="py-2.5 px-3">Waist ({unit})</th>
                  </tr>
                ) : isWomen ? (
                  <tr>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Bust ({unit})</th>
                    <th className="py-2.5 px-3">Waist ({unit})</th>
                    <th className="py-2.5 px-3">Hips ({unit})</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Chest ({unit})</th>
                    <th className="py-2.5 px-3">Waist ({unit})</th>
                    <th className="py-2.5 px-3">Length ({unit})</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {isFootwear
                  ? footwearSizes.map((row) => (
                      <tr key={row.uk} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-neutral-900">{row.uk}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.us}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.eu}</td>
                        <td className="py-2 px-3 text-neutral-700 font-medium">{row.footLength}</td>
                      </tr>
                    ))
                  : isKids
                  ? kidsSizes.map((row) => (
                      <tr key={row.size} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-neutral-900">{row.size}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.height}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.chest}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.waist}</td>
                      </tr>
                    ))
                  : isWomen
                  ? womenSizes.map((row) => (
                      <tr key={row.size} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-neutral-900">{row.size}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.bust}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.waist}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.hip}</td>
                      </tr>
                    ))
                  : menSizes.map((row) => (
                      <tr key={row.size} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-neutral-900">{row.size}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.chest}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.waist}</td>
                        <td className="py-2 px-3 text-neutral-700">{row.length}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded p-3 flex items-start gap-2 text-[11px] text-neutral-600">
            <MaterialIcon name="info" size="xs" className="text-neutral-700 shrink-0 mt-0.5" />
            <p>
              <strong>Fit Tip:</strong> If your measurements fall between two sizes, we recommend sizing up for a relaxed fit or sizing down for a closer tailored fit.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-200 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
            className="px-6 font-bold uppercase tracking-wider"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;
