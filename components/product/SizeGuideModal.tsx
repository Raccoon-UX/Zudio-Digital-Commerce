"use client";

import React from "react";
import { X, Ruler } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const apparelSizes = [
    { size: "XS", chest: '34" - 36"', waist: '28" - 30"', length: '26.5"' },
    { size: "S", chest: '36" - 38"', waist: '30" - 32"', length: '27.5"' },
    { size: "M", chest: '38" - 40"', waist: '32" - 34"', length: '28.5"' },
    { size: "L", chest: '40" - 42"', waist: '34" - 36"', length: '29.5"' },
    { size: "XL", chest: '42" - 44"', waist: '36" - 38"', length: '30.5"' },
    { size: "XXL", chest: '44" - 46"', waist: '38" - 40"', length: '31.5"' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white border border-neutral-200 p-6 shadow-2xl z-10 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-neutral-800" />
            <h3 className="text-sm font-black uppercase tracking-wider text-black">
              Standard Size Guide
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            All garment measurements are in inches. For a relaxed or oversized fit, we recommend selecting your regular size.
          </p>

          <div className="overflow-x-auto border border-neutral-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100 uppercase tracking-wider text-[11px] font-bold text-neutral-700">
                <tr>
                  <th className="py-2.5 px-3 border-b border-neutral-200">Size</th>
                  <th className="py-2.5 px-3 border-b border-neutral-200">Chest</th>
                  <th className="py-2.5 px-3 border-b border-neutral-200">Waist</th>
                  <th className="py-2.5 px-3 border-b border-neutral-200">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {apparelSizes.map((row) => (
                  <tr key={row.size} className="hover:bg-neutral-50">
                    <td className="py-2 px-3 font-bold text-black">{row.size}</td>
                    <td className="py-2 px-3 text-neutral-600">{row.chest}</td>
                    <td className="py-2 px-3 text-neutral-600">{row.waist}</td>
                    <td className="py-2 px-3 text-neutral-600">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-200 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;
