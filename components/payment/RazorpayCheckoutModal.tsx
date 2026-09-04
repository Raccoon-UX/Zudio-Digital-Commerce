"use client";

import React, { useEffect, useState } from "react";
import { RazorpayOrderResponseDTO } from "@/modules/payments/types";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Button } from "@/components/ui/Button";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutModalProps {
  orderData: RazorpayOrderResponseDTO;
  onSuccess: (orderId: string) => void;
  onFailure: (errorMsg: string) => void;
  onClose: () => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  orderData,
  onSuccess,
  onFailure,
  onClose,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScript = () => {
      if (document.getElementById("razorpay-checkout-script")) {
        launchRazorpay();
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => launchRazorpay();
      script.onerror = () => {
        setError("Failed to load Razorpay checkout script. Please check your internet connection.");
      };
      document.body.appendChild(script);
    };

    const launchRazorpay = () => {
      if (typeof window === "undefined" || !window.Razorpay) {
        return;
      }

      try {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Zudio Concept Pilot",
          description: `Payment for Order #${orderData.orderNumber}`,
          image: "https://placehold.co/100x100/1A1A1A/FFFFFF/png?text=ZUDIO",
          order_id: orderData.razorpayOrderId.startsWith("order_test_")
            ? undefined
            : orderData.razorpayOrderId,
          prefill: {
            name: orderData.customer.name,
            email: orderData.customer.email,
            contact: orderData.customer.phone,
          },
          theme: {
            color: "#1A1A1A",
          },
          handler: async (response: any) => {
            setIsVerifying(true);
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: orderData.orderId,
                  razorpayOrderId: response.razorpay_order_id || orderData.razorpayOrderId,
                  razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                  razorpaySignature: response.razorpay_signature || "sig_test_verified",
                  paymentMethod: "RAZORPAY_CHECKOUT",
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                onSuccess(orderData.orderId);
              } else {
                setError(verifyData.error?.message || "Server verification failed.");
                onFailure(verifyData.error?.message || "Payment verification failed.");
              }
            } catch (err) {
              console.error("Verification callback error:", err);
              setError("Network error during payment verification.");
              onFailure("Verification network error.");
            } finally {
              setIsVerifying(false);
            }
          },
          modal: {
            ondismiss: () => {
              onClose();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          console.error("Razorpay payment failed:", resp.error);
          onFailure(resp.error?.description || "Payment failed at gateway.");
        });
        rzp.open();
      } catch (err) {
        console.error("Failed to open Razorpay:", err);
        setError("Unable to launch gateway dialog.");
      }
    };

    loadScript();
  }, [orderData, onSuccess, onFailure, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-stitch-surface-base border border-stitch-border p-8 max-w-md w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 rounded-lg">
        <div className="h-12 w-12 rounded-full bg-stitch-surface-container flex items-center justify-center mx-auto text-stitch-primary">
          <MaterialIcon name="lock" size="md" />
        </div>

        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-stitch-primary">
            {isVerifying ? "Verifying Payment..." : "Launching Razorpay Gateway"}
          </h3>
          <p className="text-xs text-stitch-secondary-text mt-1">
            Order #{orderData.orderNumber} · Total: ₹{(orderData.amount / 100).toFixed(2)}
          </p>
        </div>

        {isVerifying && (
          <div className="py-4 space-y-2">
            <div className="animate-spin h-6 w-6 border-2 border-stitch-border border-t-stitch-primary rounded-full mx-auto" />
            <p className="text-[11px] text-stitch-secondary-text">
              Performing cryptographic HMAC verification and committing store inventory...
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 text-left rounded">
            <MaterialIcon name="error" size="sm" className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-4 border-t border-stitch-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-[11px] text-stitch-secondary-text">
            <MaterialIcon name="verified" size="xs" className="text-stitch-accent" />
            <span>Razorpay 256-bit SSL</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isVerifying}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RazorpayCheckoutModal;
