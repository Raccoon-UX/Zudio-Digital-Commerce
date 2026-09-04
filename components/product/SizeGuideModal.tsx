"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-stitch-surface-base border border-stitch-border p-6 rounded-sm shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-stitch-primary">
        <div className="flex items-center justify-between pb-4 border-b border-stitch-border">
          <div className="flex items-center gap-2">
            <MaterialIcon name="straighten" size="md" className="text-stitch-primary" />
            <h3 className="text-sm font-black uppercase tracking-wider text-stitch-primary">
              Standard Size Guide
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stitch-secondary-text hover:text-stitch-primary transition-colors"
          >
            <MaterialIcon name="close" size="sm" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <p className="text-xs text-stitch-secondary-text leading-relaxed">
            All garment measurements are in inches. For a relaxed or oversized silhouette, we recommend selecting your regular size.
          </p>

          <div className="overflow-x-auto border border-stitch-border rounded-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-stitch-surface-container uppercase tracking-wider text-[10px] font-bold text-stitch-primary">
                <tr>
                  <th className="py-2.5 px-3 border-b border-stitch-border">Size</th>
                  <th className="py-2.5 px-3 border-b border-stitch-border">Chest</th>
                  <th className="py-2.5 px-3 border-b border-stitch-border">Waist</th>
                  <th className="py-2.5 px-3 border-b border-stitch-border">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stitch-border">
                {apparelSizes.map((row) => (
                  <tr key={row.size} className="hover:bg-stitch-surface-container/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-stitch-primary">{row.size}</td>
                    <td className="py-2.5 px-3 text-stitch-secondary-text">{row.chest}</td>
                    <td className="py-2.5 px-3 text-stitch-secondary-text">{row.waist}</td>
                    <td className="py-2.5 px-3 text-stitch-secondary-text">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-3 border-t border-stitch-border flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;

