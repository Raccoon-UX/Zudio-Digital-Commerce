"use client";

import React from "react";
import Image from "next/image";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface DemoQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  amount: number;
  onProceedToGateway: () => void;
}

export const DemoQRModal: React.FC<DemoQRModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  onProceedToGateway,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Dark Dimmed Backdrop Overlay with Smooth Blur */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Clean Premium Solid White Modal Surface (Matches Stitch & Zudio Design) */}
      <div className="relative w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-center space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <Badge
            variant="warning"
            className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-sm"
          >
            DEMO QR — CONCEPT PROTOTYPE ONLY
          </Badge>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <MaterialIcon name="close" size="sm" />
          </button>
        </div>

        {/* Title & Order Summary */}
        <div className="space-y-1 pt-1">
          <h3 className="text-xl font-black uppercase tracking-tight text-neutral-900">
            UPI / QR Payment Guide
          </h3>
          <p className="text-xs text-neutral-600">
            Order <span className="font-mono font-bold text-neutral-800">#{orderNumber}</span> · Total:{" "}
            <strong className="text-neutral-900 font-black text-sm">{formatCurrency(amount)}</strong>
          </p>
        </div>

        {/* User's Exact Custom QR Code Preview Box */}
        <div className="p-4 bg-neutral-50/90 border border-neutral-200/90 rounded-2xl inline-block mx-auto space-y-2.5 w-full max-w-[280px] shadow-xs">
          <div className="relative w-52 h-52 mx-auto bg-white p-2 border border-neutral-200 rounded-xl flex items-center justify-center shadow-xs overflow-hidden">
            <Image
              src="/famAppQR.jpeg"
              alt="UPI Payment QR Code"
              width={200}
              height={200}
              className="w-full h-full object-contain rounded-lg"
              priority
            />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs uppercase tracking-wider font-bold text-neutral-800">
              Scan with any UPI App
            </p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
              (Demo Illustration)
            </p>
          </div>
        </div>

        {/* Prototype Notice Banner */}
        <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 text-left text-xs text-amber-950 space-y-1 rounded-xl">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <MaterialIcon name="warning" size="xs" className="text-amber-700 shrink-0" />
            <span className="text-[11px] uppercase tracking-wide">Prototype Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900/90">
            This QR code is an illustrative prototype interface for Zudio Digital Commerce. To complete a verified test payment with cryptographic proof and inventory commitment, proceed to the <strong className="text-amber-950 font-bold">Razorpay Test Gateway</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onClose();
              onProceedToGateway();
            }}
            className="w-full h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-black text-white rounded-xl shadow-sm"
          >
            <MaterialIcon name="credit_card" size="xs" />
            <span>Proceed to Razorpay Test Gateway</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="w-full h-11 text-xs font-bold uppercase tracking-wider border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 text-neutral-800 rounded-xl"
          >
            Close
          </Button>
        </div>

        {/* Security / Test Environment Footer Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 pt-1">
          <MaterialIcon name="shield" size="xs" className="text-neutral-600" />
          <span>This is a secure test environment. No real money will be charged.</span>
        </div>
      </div>
    </div>
  );
};

export default DemoQRModal;
