"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  MapPin,
  Truck,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Lock,
  QrCode,
  Store,
} from "lucide-react";
import { CheckoutValidationResultDTO } from "@/modules/orders/types";
import { RazorpayOrderResponseDTO } from "@/modules/payments/types";
import { RazorpayCheckoutModal } from "@/components/payment/RazorpayCheckoutModal";
import { DemoQRModal } from "@/components/payment/DemoQRModal";

interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [validation, setValidation] = useState<CheckoutValidationResultDTO | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isNewAddressForm, setIsNewAddressForm] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<"RAZORPAY" | "DEMO_QR">("RAZORPAY");

  // Address Form inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Payment Modals
  const [razorpayOrderData, setRazorpayOrderData] = useState<RazorpayOrderResponseDTO | null>(null);
  const [demoQROrder, setDemoQROrder] = useState<{ id: string; orderNumber: string; amount: number } | null>(null);

  const initCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const valRes = await fetch("/api/checkout/validate", { method: "POST" });
      const valData = await valRes.json();

      if (!valData.success) {
        setError(valData.error?.message || "Failed to validate checkout items.");
        setIsLoading(false);
        return;
      }

      setValidation(valData.data);

      if (session?.user) {
        const addrRes = await fetch("/api/user/addresses");
        const addrData = await addrRes.json();
        if (addrData.success && addrData.data.length > 0) {
          setSavedAddresses(addrData.data);
          const defaultAddr = addrData.data.find((a: SavedAddress) => a.isDefault) || addrData.data[0];
          setSelectedAddressId(defaultAddr.id);
          setIsNewAddressForm(false);
        } else {
          setIsNewAddressForm(true);
        }
      } else {
        setIsNewAddressForm(true);
      }
    } catch (err) {
      console.error("Init checkout error:", err);
      setError("Unable to connect to checkout service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "loading") {
      initCheckout();
    }
  }, [status, session]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlacingOrder(true);
    setError(null);

    try {
      let orderPayload: any = { notes };

      if (session?.user && selectedAddressId && !isNewAddressForm) {
        orderPayload.addressId = selectedAddressId;
      } else {
        if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
          setError("Please complete all required delivery address fields.");
          setIsPlacingOrder(false);
          return;
        }

        if (!session?.user && (!email || !email.includes("@"))) {
          setError("A valid email address is required for order confirmation.");
          setIsPlacingOrder(false);
          return;
        }

        orderPayload.guestAddress = {
          fullName,
          email: session?.user?.email || email,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
        };
      }

      // 1. Create order in PostgreSQL (Order: ORDER_PLACED, Payment: PENDING)
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        setError(orderData.error?.message || "Failed to place order.");
        setIsPlacingOrder(false);
        return;
      }

      const createdOrder = orderData.data;

      // 2. Initialize Payment Gateway / Modal
      if (paymentChoice === "DEMO_QR") {
        setDemoQROrder({
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          amount: createdOrder.total,
        });
        setIsPlacingOrder(false);
      } else {
        // Razorpay Gateway
        const rzpRes = await fetch("/api/payments/razorpay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: createdOrder.id }),
        });

        const rzpData = await rzpRes.json();

        if (rzpData.success) {
          setRazorpayOrderData(rzpData.data);
        } else {
          // If direct modal fails to initialize, route to order page where payment can be retried
          router.push(`/orders/${createdOrder.id}`);
        }
        setIsPlacingOrder(false);
      }
    } catch (err) {
      console.error("Order placement error:", err);
      setError("An unexpected error occurred while processing checkout.");
      setIsPlacingOrder(false);
    }
  };

  const handlePaymentSuccess = (orderId: string) => {
    setRazorpayOrderData(null);
    setDemoQROrder(null);
    router.push(`/orders/${orderId}?payment=success`);
  };

  if (isLoading) {
    return (
      <div className="py-12 bg-white min-h-screen">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error && !validation) {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-rose-50 border border-rose-200 inline-block rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold uppercase text-black mb-2">Checkout Error</h2>
          <p className="text-xs text-neutral-500 mb-6">{error}</p>
          <Link href="/cart">
            <Button variant="primary" size="sm">
              Return to Bag
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 bg-neutral-50 min-h-screen">
      <Container size="xl">
        <div className="pb-6 mb-6 border-b border-neutral-200">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
            <span>Bag</span> / <span className="text-black">Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Secure Checkout
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact, Address, and Payment Selection */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Contact Information */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-black">
                    Contact Information
                  </h3>
                </div>
                {!session?.user && (
                  <span className="text-[11px] text-neutral-500">
                    Already have an account?{" "}
                    <Link
                      href="/login?callbackUrl=/checkout"
                      className="font-bold text-black uppercase underline"
                    >
                      Sign In
                    </Link>
                  </span>
                )}
              </div>

              {session?.user ? (
                <div className="flex items-center justify-between text-xs p-3 bg-neutral-50 border border-neutral-200">
                  <div>
                    <span className="font-bold text-black">{session.user.name}</span>
                    <p className="text-neutral-500">{session.user.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    Logged In
                  </Badge>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-black mb-1">
                      Email Address (for order confirmation) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-black mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Address */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-black">
                    Delivery Address
                  </h3>
                </div>
                {session?.user && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsNewAddressForm(!isNewAddressForm)}
                    className="text-xs font-bold uppercase tracking-wider text-black underline flex items-center gap-1"
                  >
                    {isNewAddressForm ? "Select Saved Address" : "+ Use New Address"}
                  </button>
                )}
              </div>

              {session?.user && savedAddresses.length > 0 && !isNewAddressForm ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`p-4 border block cursor-pointer transition-colors relative ${
                        selectedAddressId === addr.id
                          ? "border-black bg-neutral-50"
                          : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="addressSelection"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="text-black focus:ring-black"
                          />
                          <span className="text-xs font-bold uppercase text-black">
                            {addr.fullName}
                          </span>
                        </div>
                        {addr.isDefault && (
                          <Badge variant="default" className="text-[8px]">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 mt-2 leading-relaxed pl-5">
                        {addr.addressLine1}
                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                        <br />
                        {addr.city}, {addr.state} - {addr.pincode}
                        <br />
                        <span className="text-neutral-500">Phone: {addr.phone}</span>
                      </p>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-black mb-1">
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                      />
                    </div>
                    {session?.user && (
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-black mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-black mb-1">
                      Street Address / House No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Flat, House No., Apartment, Building"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-black mb-1">
                      Apartment, suite, landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-black mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-black mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-black mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        pattern="[0-9]{6}"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment Method Selection */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
                <div className="h-6 w-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  Select Payment Experience
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Razorpay Gateway Option */}
                <label
                  className={`p-4 border block cursor-pointer transition-colors ${
                    paymentChoice === "RAZORPAY"
                      ? "border-black bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentChoice"
                        checked={paymentChoice === "RAZORPAY"}
                        onChange={() => setPaymentChoice("RAZORPAY")}
                        className="text-black focus:ring-black"
                      />
                      <span className="text-xs font-bold uppercase text-black">
                        Razorpay Gateway
                      </span>
                    </div>
                    <CreditCard className="h-4 w-4 text-black" />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-2 pl-5">
                    Cards, NetBanking, UPI, and Wallets with secure 256-bit encryption.
                  </p>
                </label>

                {/* Demo UPI / QR Option */}
                <label
                  className={`p-4 border block cursor-pointer transition-colors ${
                    paymentChoice === "DEMO_QR"
                      ? "border-black bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentChoice"
                        checked={paymentChoice === "DEMO_QR"}
                        onChange={() => setPaymentChoice("DEMO_QR")}
                        className="text-black focus:ring-black"
                      />
                      <span className="text-xs font-bold uppercase text-black">
                        Demo UPI / QR
                      </span>
                    </div>
                    <QrCode className="h-4 w-4 text-black" />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-2 pl-5">
                    Visual QR prototype with server-side test verification.
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Delivery Notes / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please ring doorbell"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 py-2 px-3 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Fulfillment Allocation */}
          <div className="lg:col-span-4 bg-white border border-neutral-200 p-6 shadow-sm space-y-6 sticky top-28">
            <div className="space-y-1 pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-black uppercase tracking-wider text-black">
                Order Review ({validation?.itemCount})
              </h3>
              {validation?.allocatedStore && (
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600">
                  <Store className="h-3.5 w-3.5 text-neutral-800" />
                  <span>
                    Fulfillment Store: <strong className="text-black">{validation.allocatedStore.storeName}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Items scroll */}
            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 space-y-3">
              {validation?.items.map((item) => (
                <div key={item.variantId} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold uppercase text-black line-clamp-1">
                      {item.productName}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Qty: {item.quantity} · {item.sizeName} / {item.colorName}
                    </p>
                  </div>
                  <span className="font-black text-black shrink-0">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-bold text-black">
                  {formatCurrency(validation?.subtotal || 0)}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charge</span>
                <span>
                  {validation?.deliveryFee === 0 ? (
                    <strong className="text-emerald-700 uppercase">FREE</strong>
                  ) : (
                    formatCurrency(validation?.deliveryFee || 0)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-sm font-black uppercase text-black">
                  Total Amount
                </span>
                <span className="text-xl font-black text-black">
                  {formatCurrency(validation?.total || 0)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isPlacingOrder}
              className="w-full text-xs tracking-wider"
            >
              <Lock className="h-4 w-4 mr-2" />
              Pay {formatCurrency(validation?.total || 0)}
            </Button>

            <div className="p-3 bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-500 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-black shrink-0" />
                <span>Verified Server Verification</span>
              </div>
              <p>
                Store inventory is committed atomically upon cryptographic payment verification.
              </p>
            </div>
          </div>
        </form>
      </Container>

      {/* Razorpay Gateway Modal */}
      {razorpayOrderData && (
        <RazorpayCheckoutModal
          orderData={razorpayOrderData}
          onSuccess={handlePaymentSuccess}
          onFailure={(msg) => {
            setError(msg);
            setRazorpayOrderData(null);
          }}
          onClose={() => setRazorpayOrderData(null)}
        />
      )}

      {/* Demo QR Prototype Modal */}
      {demoQROrder && (
        <DemoQRModal
          isOpen={Boolean(demoQROrder)}
          onClose={() => setDemoQROrder(null)}
          orderId={demoQROrder.id}
          orderNumber={demoQROrder.orderNumber}
          amount={demoQROrder.amount}
          onProceedToGateway={async () => {
            const currentOrderId = demoQROrder.id;
            setDemoQROrder(null);
            setIsPlacingOrder(true);
            try {
              const rzpRes = await fetch("/api/payments/razorpay/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: currentOrderId }),
              });
              const rzpData = await rzpRes.json();
              if (rzpData.success) {
                setRazorpayOrderData(rzpData.data);
              } else {
                router.push(`/orders/${currentOrderId}`);
              }
            } catch {
              router.push(`/orders/${currentOrderId}`);
            } finally {
              setIsPlacingOrder(false);
            }
          }}
        />
      )}
    </div>
  );
}
