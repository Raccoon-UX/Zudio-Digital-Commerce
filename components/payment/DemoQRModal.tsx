"use client";

import React from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-stitch-surface-base border border-stitch-border p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 text-center space-y-4 max-h-[90vh] overflow-y-auto rounded-lg">
        <div className="flex items-center justify-between pb-3 border-b border-stitch-border">
          <Badge variant="warning" className="text-[9px] font-bold">
            DEMO QR — CONCEPT PROTOTYPE ONLY
          </Badge>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stitch-secondary-text hover:text-stitch-primary transition-colors"
            aria-label="Close"
          >
            <MaterialIcon name="close" size="sm" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-stitch-primary">
            UPI / QR Payment Guide
          </h3>
          <p className="text-xs text-stitch-secondary-text mt-0.5">
            Order #{orderNumber} · Total: <strong>{formatCurrency(amount)}</strong>
          </p>
        </div>

        {/* Visual Prototype QR Box */}
        <div className="p-4 bg-stitch-surface-container/60 border border-stitch-border inline-block mx-auto space-y-2 rounded">
          <div className="relative w-44 h-44 mx-auto bg-white p-2 border border-stitch-border flex items-center justify-center shadow-inner rounded">
            <MaterialIcon name="qr_code_2" size="xl" className="text-stitch-primary text-7xl" />
          </div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-stitch-secondary-text">
            Scan with any UPI App (Demo Illustration)
          </p>
        </div>

        {/* Prototype Disclaimer Banner */}
        <div className="p-3 bg-amber-50 border border-amber-200 text-left text-[11px] text-amber-900 space-y-1 rounded">
          <div className="flex items-center gap-1.5 font-bold">
            <MaterialIcon name="warning" size="xs" className="text-amber-700 shrink-0" />
            <span>Prototype Notice</span>
          </div>
          <p className="leading-normal text-amber-800">
            This QR code is an illustrative prototype interface for Zudio Digital Commerce. To complete a verified test payment with cryptographic proof and inventory commitment, proceed to the <strong>Razorpay Test Gateway</strong>.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onClose();
              onProceedToGateway();
            }}
            className="w-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <MaterialIcon name="credit_card" size="xs" />
            Proceed to Razorpay Test Gateway
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose} className="w-full text-xs font-bold uppercase tracking-wider">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DemoQRModal;
