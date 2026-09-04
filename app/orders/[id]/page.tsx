"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { OrderDTO } from "@/modules/orders/types";
import { RazorpayOrderResponseDTO } from "@/modules/payments/types";
import { RazorpayCheckoutModal } from "@/components/payment/RazorpayCheckoutModal";
import { DemoQRModal } from "@/components/payment/DemoQRModal";

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const isPaymentSuccessNotice = searchParams.get("payment") === "success";

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment triggers
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<RazorpayOrderResponseDTO | null>(null);
  const [isDemoQROpen, setIsDemoQROpen] = useState(false);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        setError(data.error?.message || "Order not found.");
      }
    } catch (err) {
      console.error("Fetch order detail error:", err);
      setError("Unable to connect to order service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleLaunchRazorpayPayment = async () => {
    setIsRetryingPayment(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/retry-payment`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setRazorpayOrderData(data.data);
      } else {
        alert(data.error?.message || "Failed to initialize payment gateway.");
      }
    } catch (err) {
      console.error("Retry payment error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setIsRetryingPayment(false);
    }
  };

  const handlePaymentCompleted = () => {
    setRazorpayOrderData(null);
    setIsDemoQROpen(false);
    fetchOrder();
  };

  if (isLoading) {
    return (
      <div className="py-12 bg-white min-h-screen">
        <Container size="lg" className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-rose-50 border border-rose-200 inline-flex items-center justify-center mb-4">
            <MaterialIcon name="error" size={32} className="text-rose-600" />
          </div>
          <h2 className="text-xl font-bold uppercase text-black mb-2">Order Not Found</h2>
          <p className="text-xs text-neutral-500 mb-6">{error || "The requested order could not be retrieved."}</p>
          <Link href="/orders">
            <Button variant="primary" size="sm">
              Back to Orders
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  const steps = [
    { title: "Order Placed", key: "ORDER_PLACED", iconName: "check_circle" },
    { title: "Confirmed", key: "CONFIRMED", iconName: "inventory_2" },
    { title: "Shipped", key: "SHIPPED", iconName: "local_shipping" },
    { title: "Delivered", key: "DELIVERED", iconName: "location_on" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "ORDER_PLACED":
        return 0;
      case "CONFIRMED":
      case "PROCESSING":
        return 1;
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return 2;
      case "DELIVERED":
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isPaid = order.paymentStatus === "PAID";

  return (
    <div className="py-10 bg-neutral-50 min-h-screen">
      <Container size="lg">
        {/* Navigation back */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
          >
            <MaterialIcon name="arrow_back" size={16} />
            <span>Back to Orders</span>
          </Link>
        </div>

        {/* Payment Success Celebratory Banner */}
        {isPaymentSuccessNotice && isPaid && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in slide-in-from-top">
            <MaterialIcon name="check_circle" size={24} className="text-emerald-700 shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Payment Verified & Store Inventory Committed!
              </h4>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Your order is confirmed and scheduled for dispatch from our fulfillment store network.
              </p>
            </div>
          </div>
        )}

        {/* Confirmation Header Banner */}
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <MaterialIcon name={isPaid ? "check_circle" : "schedule"} size={24} />
              </div>
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    isPaid ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {isPaid ? "Order Confirmed & Paid" : "Order Placed — Payment Pending"}
                </span>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black font-mono">
                  {order.orderNumber}
                </h1>
                <p className="text-xs text-neutral-500">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="text-xs">
                {order.status}
              </Badge>
              {isPaid ? (
                <Badge variant="success" className="text-xs">
                  Payment: PAID ✓
                </Badge>
              ) : (
                <Badge variant="warning" className="text-xs">
                  Payment: PENDING
                </Badge>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="pt-6 border-t border-neutral-100">
            <div className="grid grid-cols-4 gap-2">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="text-center space-y-1.5">
                    <div
                      className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center border transition-colors ${
                        isPassed
                          ? "bg-black text-white border-black"
                          : "bg-neutral-100 text-neutral-400 border-neutral-300"
                      }`}
                    >
                      <MaterialIcon name={step.iconName} size={16} />
                    </div>
                    <p
                      className={`text-[10px] uppercase tracking-wider font-bold ${
                        isCurrent
                          ? "text-black"
                          : isPassed
                          ? "text-neutral-700"
                          : "text-neutral-400"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two Column Layout: Receipt Items + Delivery/Payment Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Itemized Receipt */}
          <div className="lg:col-span-8 bg-white border border-neutral-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-black uppercase tracking-wider text-black">
                Purchased Items ({order.itemCount})
              </h3>
              {order.fulfillmentStore && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                  <MaterialIcon name="storefront" size={16} className="text-black" />
                  <span>
                    Fulfilled by: <strong>{order.fulfillmentStore.name}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="divide-y divide-neutral-100">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold uppercase tracking-wide text-black">
                      {item.productName}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Size: <strong className="text-neutral-800">{item.sizeName}</strong> · Color:{" "}
                      <strong className="text-neutral-800">{item.colorName}</strong>
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      SKU: {item.variantSku}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right">
                    <span className="text-neutral-500 text-xs">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </span>
                    <span className="font-black text-black text-sm">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-6 border-t border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-black">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charge</span>
                <span>
                  {order.deliveryFee === 0 ? (
                    <strong className="text-emerald-700 uppercase">FREE</strong>
                  ) : (
                    formatCurrency(order.deliveryFee)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-sm font-black uppercase text-black">
                  Total Payable
                </span>
                <span className="text-xl font-black text-black">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Delivery Snapshot & Payment Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Payment Actions / Verified Box */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
                <MaterialIcon name="credit_card" size={16} className="text-black" />
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  Payment Details
                </h3>
              </div>

              {isPaid ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <MaterialIcon name="verified_user" size={16} className="text-emerald-700" />
                      <span>Payment Verified</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Payment ID: <code className="font-mono">{order.paymentDetails?.razorpayPaymentId}</code>
                    </p>
                    {order.paymentDetails?.verifiedAt && (
                      <p className="text-[10px] text-emerald-700">
                        Verified at: {formatDate(order.paymentDetails.verifiedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Unpaid Pending Order: Show Pay Now options */
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <p className="font-bold mb-1">Awaiting Payment</p>
                    <p className="text-[11px] text-amber-800 leading-normal">
                      Complete payment now to confirm your order and allocate store inventory.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isRetryingPayment}
                    onClick={handleLaunchRazorpayPayment}
                    className="w-full text-xs font-bold tracking-wider inline-flex items-center justify-center gap-1.5"
                  >
                    <MaterialIcon name="credit_card" size={16} />
                    <span>Pay with Razorpay ({formatCurrency(order.total)})</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDemoQROpen(true)}
                    className="w-full text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <MaterialIcon name="qr_code_2" size={16} />
                    <span>Pay via Demo QR</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Delivery Address Snapshot */}
            {order.address && (
              <div className="bg-white border border-neutral-200 p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
                  <MaterialIcon name="location_on" size={16} className="text-black" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-black">
                    Delivery Address Snapshot
                  </h3>
                </div>

                <div className="text-xs text-neutral-700 space-y-1">
                  <p className="font-bold uppercase text-black">
                    {order.address.fullName}
                  </p>
                  <p className="leading-relaxed text-neutral-600">
                    {order.address.addressLine1}
                    {order.address.addressLine2 && `, ${order.address.addressLine2}`}
                    <br />
                    {order.address.city}, {order.address.state} -{" "}
                    <strong>{order.address.pincode}</strong>
                  </p>
                  <p className="text-neutral-500 pt-1">
                    Phone: {order.address.phone}
                  </p>
                  {order.guestEmail && (
                    <p className="text-neutral-500">Email: {order.guestEmail}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Razorpay Gateway Modal */}
      {razorpayOrderData && (
        <RazorpayCheckoutModal
          orderData={razorpayOrderData}
          onSuccess={handlePaymentCompleted}
          onFailure={(msg) => {
            alert(msg);
            setRazorpayOrderData(null);
          }}
          onClose={() => setRazorpayOrderData(null)}
        />
      )}

      {/* Demo QR Modal */}
      {isDemoQROpen && (
        <DemoQRModal
          isOpen={isDemoQROpen}
          onClose={() => setIsDemoQROpen(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
          amount={order.total}
          onProceedToGateway={() => {
            setIsDemoQROpen(false);
            handleLaunchRazorpayPayment();
          }}
        />
      )}
    </div>
  );
}
