"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { formatCurrency } from "@/lib/utils";
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

  // Mobile order summary accordion toggle
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

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
      <div className="py-8 sm:py-12 bg-stitch-surface-base min-h-screen">
        <Container size="xl">
          <div className="mb-6 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error && !validation) {
    return (
      <div className="py-20 bg-stitch-surface-base min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-stitch-surface-container border border-rose-200 inline-block rounded-full mb-4">
            <MaterialIcon name="error" size="xl" className="text-stitch-error" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-stitch-primary mb-2">
            Checkout Unavailable
          </h2>
          <p className="text-xs text-stitch-secondary-text mb-6 max-w-sm mx-auto">
            {error}
          </p>
          <Link href="/cart">
            <Button variant="primary" size="md" className="text-xs font-bold uppercase tracking-wider">
              Return to Bag
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 pb-32 lg:pb-12 bg-stitch-surface-base min-h-screen text-stitch-primary font-sans">
      <Container size="xl">
        {/* Header & Breadcrumb */}
        <div className="pb-5 mb-6 border-b border-stitch-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-stitch-secondary-text uppercase tracking-wider mb-1">
              <Link href="/cart" className="hover:text-stitch-primary transition-colors">Bag</Link>
              <span>/</span>
              <span className="text-stitch-primary font-bold">Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-stitch-primary">
              Secure Checkout
            </h1>
          </div>
          <Link href="/cart" className="hidden sm:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stitch-secondary-text hover:text-stitch-primary transition-colors">
            <MaterialIcon name="arrow_back" size="xs" />
            <span>Return to Bag</span>
          </Link>
        </div>

        {/* Stitch 4-Step Progress Stepper: CONTACT -> DELIVERY -> SHIPPING -> PAYMENT */}
        <div className="mb-8 bg-stitch-surface-container/40 border border-stitch-border p-4 rounded-lg">
          <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider mb-2">
            <span className="text-stitch-primary flex items-center gap-1">
              <span className="h-4 w-4 rounded-full bg-stitch-primary text-white text-[9px] flex items-center justify-center font-bold">1</span>
              CONTACT
            </span>
            <span className="text-stitch-primary flex items-center gap-1">
              <span className="h-4 w-4 rounded-full bg-stitch-primary text-white text-[9px] flex items-center justify-center font-bold">2</span>
              DELIVERY
            </span>
            <span className="text-stitch-primary flex items-center gap-1">
              <span className="h-4 w-4 rounded-full bg-stitch-primary text-white text-[9px] flex items-center justify-center font-bold">3</span>
              SHIPPING
            </span>
            <span className="text-stitch-primary flex items-center gap-1">
              <span className="h-4 w-4 rounded-full bg-stitch-primary text-white text-[9px] flex items-center justify-center font-bold">4</span>
              PAYMENT
            </span>
          </div>
          <div className="w-full bg-stitch-surface-container h-1.5 rounded-full overflow-hidden border border-stitch-border/50">
            <div className="bg-stitch-primary h-full w-full rounded-full transition-all duration-500" />
          </div>
        </div>

        {/* Mobile Collapsible Order Summary Accordion (Stitch Screen e88e6048ab8c4aa590d9bcdff15a2876) */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
            className="w-full bg-stitch-surface-container/60 border border-stitch-border rounded-lg p-4 flex justify-between items-center transition-colors"
          >
            <div className="flex items-center gap-2">
              <MaterialIcon name="shopping_bag" size="sm" className="text-stitch-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-stitch-primary">
                {isMobileSummaryOpen ? "Hide order summary" : "Show order summary"} ({validation?.itemCount})
              </span>
              <MaterialIcon
                name="expand_more"
                size="sm"
                className={`text-stitch-secondary-text transition-transform duration-300 ${
                  isMobileSummaryOpen ? "rotate-180" : ""
                }`}
              />
            </div>
            <span className="text-sm font-black text-stitch-primary">
              {formatCurrency(validation?.total || 0)}
            </span>
          </button>

          {isMobileSummaryOpen && (
            <div className="mt-2 bg-stitch-surface-container/30 border border-stitch-border rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="max-h-56 overflow-y-auto divide-y divide-stitch-border/60">
                {validation?.items.map((item) => (
                  <div key={item.variantId} className="py-2.5 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold uppercase text-stitch-primary line-clamp-1">{item.productName}</h4>
                      <p className="text-[11px] text-stitch-secondary-text">Qty: {item.quantity} · {item.sizeName} / {item.colorName}</p>
                    </div>
                    <span className="font-black text-stitch-primary shrink-0">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-stitch-border pt-3 space-y-1.5 text-xs text-stitch-secondary-text">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-stitch-primary">{formatCurrency(validation?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Delivery</span>
                  <span>{validation?.deliveryFee === 0 ? <strong className="text-stitch-accent uppercase">FREE</strong> : formatCurrency(validation?.deliveryFee || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stitch-border font-black text-stitch-primary text-sm">
                  <span>Total</span>
                  <span>{formatCurrency(validation?.total || 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5 rounded-lg">
            <MaterialIcon name="error" size="sm" className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 4-Step Checkout Modules */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Contact Information */}
            <div className="bg-stitch-surface-base border border-stitch-border p-5 sm:p-6 rounded-lg shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stitch-border">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-stitch-primary text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-stitch-primary">
                    Contact Information
                  </h3>
                </div>
                {!session?.user && (
                  <span className="text-[11px] text-stitch-secondary-text">
                    Already have an account?{" "}
                    <Link
                      href="/login?callbackUrl=/checkout"
                      className="font-bold text-stitch-primary uppercase underline"
                    >
                      Sign In
                    </Link>
                  </span>
                )}
              </div>

              {session?.user ? (
                <div className="flex items-center justify-between text-xs p-3.5 bg-stitch-surface-container/50 border border-stitch-border rounded">
                  <div>
                    <span className="font-bold text-stitch-primary">{session.user.name}</span>
                    <p className="text-stitch-secondary-text">{session.user.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    Logged In
                  </Badge>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                      Email Address (for order confirmation) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 bg-stitch-surface-base border border-stitch-border rounded px-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-11 bg-stitch-surface-base border border-stitch-border rounded px-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Address */}
            <div className="bg-stitch-surface-base border border-stitch-border p-5 sm:p-6 rounded-lg shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stitch-border">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-stitch-primary text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-stitch-primary">
                    Delivery Address
                  </h3>
                </div>
                {session?.user && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsNewAddressForm(!isNewAddressForm)}
                    className="text-xs font-bold uppercase tracking-wider text-stitch-primary underline flex items-center gap-1"
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
                      className={`p-4 border rounded block cursor-pointer transition-colors relative ${
                        selectedAddressId === addr.id
                          ? "border-stitch-primary bg-stitch-surface-container/50"
                          : "border-stitch-border hover:border-stitch-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="addressSelection"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="text-stitch-primary focus:ring-stitch-primary"
                          />
                          <span className="text-xs font-bold uppercase text-stitch-primary">
                            {addr.fullName}
                          </span>
                        </div>
                        {addr.isDefault && (
                          <Badge variant="default" className="text-[8px] font-bold">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-stitch-secondary-text mt-2 leading-relaxed pl-5">
                        {addr.addressLine1}
                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                        <br />
                        {addr.city}, {addr.state} - {addr.pincode}
                        <br />
                        <span className="text-stitch-primary font-medium">Phone: {addr.phone}</span>
                      </p>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 bg-stitch-surface-base border border-stitch-border rounded px-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                      />
                    </div>
                    {session?.user && (
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-11 bg-stitch-surface-base border border-stitch-border rounded px-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                      Street Address / House No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Flat, House No., Building, Street"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full h-11 bg-stitch-surface-base border border-stitch-border rounded px-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                      Apartment, suite, landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Landmark or area"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full h-11 bg-stitch-surface-base border border-stitch-border rounded px-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-11 bg-stitch-surface-base border border-stitch-border rounded px-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full h-11 bg-stitch-surface-base border border-stitch-border rounded px-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        pattern="[0-9]{6}"
                        placeholder="6-digit PIN"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full h-11 bg-stitch-surface-base border border-stitch-border rounded px-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Shipping & Fulfillment */}
            <div className="bg-stitch-surface-base border border-stitch-border p-5 sm:p-6 rounded-lg shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stitch-border">
                <div className="h-6 w-6 rounded-full bg-stitch-primary text-white text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stitch-primary">
                  Shipping & Fulfillment
                </h3>
              </div>

              <div className="p-4 bg-stitch-surface-container/50 border border-stitch-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MaterialIcon name="local_shipping" size="md" className="text-stitch-accent" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stitch-primary">
                        Standard Delivery (3–5 Business Days)
                      </h4>
                      <p className="text-[11px] text-stitch-secondary-text">
                        Free delivery on orders above ₹799 · Direct doorstep dispatch
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase text-stitch-primary">
                    {validation?.deliveryFee === 0 ? (
                      <strong className="text-stitch-accent">FREE</strong>
                    ) : (
                      formatCurrency(validation?.deliveryFee || 0)
                    )}
                  </span>
                </div>

                {validation?.allocatedStore && (
                  <div className="pt-3 border-t border-stitch-border/60 flex items-center gap-2 text-[11px] text-stitch-secondary-text">
                    <MaterialIcon name="storefront" size="xs" className="text-stitch-primary" />
                    <span>
                      Allocated Fulfillment Branch: <strong className="text-stitch-primary">{validation.allocatedStore.storeName}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Payment Experience */}
            <div className="bg-stitch-surface-base border border-stitch-border p-5 sm:p-6 rounded-lg shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stitch-border">
                <div className="h-6 w-6 rounded-full bg-stitch-primary text-white text-xs font-bold flex items-center justify-center">
                  4
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stitch-primary">
                  Select Payment Experience
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Razorpay Gateway Option */}
                <label
                  className={`p-4 border rounded block cursor-pointer transition-colors ${
                    paymentChoice === "RAZORPAY"
                      ? "border-stitch-primary bg-stitch-surface-container/50"
                      : "border-stitch-border hover:border-stitch-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentChoice"
                        checked={paymentChoice === "RAZORPAY"}
                        onChange={() => setPaymentChoice("RAZORPAY")}
                        className="text-stitch-primary focus:ring-stitch-primary"
                      />
                      <span className="text-xs font-bold uppercase text-stitch-primary">
                        Razorpay Gateway
                      </span>
                    </div>
                    <MaterialIcon name="credit_card" size="sm" className="text-stitch-primary" />
                  </div>
                  <p className="text-[11px] text-stitch-secondary-text mt-2 pl-5">
                    Cards, NetBanking, UPI, and Wallets with secure 256-bit encryption.
                  </p>
                </label>

                {/* Demo UPI / QR Option */}
                <label
                  className={`p-4 border rounded-lg block cursor-pointer transition-all ${
                    paymentChoice === "DEMO_QR"
                      ? "border-stitch-primary bg-stitch-surface-container/60 ring-1 ring-stitch-primary shadow-xs"
                      : "border-stitch-border bg-white hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentChoice"
                          checked={paymentChoice === "DEMO_QR"}
                          onChange={() => setPaymentChoice("DEMO_QR")}
                          className="h-4 w-4 text-stitch-primary focus:ring-stitch-primary"
                        />
                        <span className="text-xs font-bold uppercase tracking-wide text-stitch-primary">
                          Demo UPI / QR
                        </span>
                      </div>
                      <p className="text-[11px] text-stitch-secondary-text mt-1.5 pl-6 leading-relaxed">
                        Visual QR prototype with server-side test verification.
                      </p>
                    </div>

                    {/* QR Code Thumbnail Preview */}
                    <div className="shrink-0 bg-white p-1 border border-neutral-200 rounded shadow-xs">
                      <Image
                        src="/famAppQR.jpeg"
                        alt="Demo QR Preview"
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain rounded"
                      />
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stitch-primary mb-1.5">
                  Delivery Notes / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ring doorbell, leave with guard"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stitch-surface-base border border-stitch-border rounded p-3 text-xs text-stitch-primary placeholder:text-stitch-secondary-text focus:outline-none focus:border-stitch-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Sticky Summary (Desktop) */}
          <div className="hidden lg:block lg:col-span-4 bg-stitch-surface-container/60 border border-stitch-border p-5 sm:p-6 rounded-lg space-y-6 sticky top-28">
            <div className="space-y-1 pb-3 border-b border-stitch-border">
              <h3 className="text-xs font-black uppercase tracking-wider text-stitch-primary">
                Order Review ({validation?.itemCount} {validation?.itemCount === 1 ? "Item" : "Items"})
              </h3>
              {validation?.allocatedStore && (
                <div className="flex items-center gap-1.5 text-[11px] text-stitch-secondary-text pt-1">
                  <MaterialIcon name="storefront" size="xs" className="text-stitch-primary" />
                  <span>
                    Fulfillment: <strong className="text-stitch-primary">{validation.allocatedStore.storeName}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Scrollable Items List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-stitch-border/60 space-y-3">
              {validation?.items.map((item) => (
                <div key={item.variantId} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold uppercase text-stitch-primary line-clamp-1">
                      {item.productName}
                    </h4>
                    <p className="text-[11px] text-stitch-secondary-text">
                      Qty: {item.quantity} · {item.sizeName} / {item.colorName}
                    </p>
                  </div>
                  <span className="font-black text-stitch-primary shrink-0">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-stitch-border pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-stitch-secondary-text">
                <span>Subtotal</span>
                <span className="font-bold text-stitch-primary">
                  {formatCurrency(validation?.subtotal || 0)}
                </span>
              </div>

              <div className="flex justify-between text-stitch-secondary-text">
                <span>Standard Delivery</span>
                <span>
                  {validation?.deliveryFee === 0 ? (
                    <strong className="text-stitch-accent font-bold uppercase">FREE</strong>
                  ) : (
                    formatCurrency(validation?.deliveryFee || 0)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-stitch-border flex justify-between items-baseline">
                <span className="text-sm font-black uppercase text-stitch-primary">
                  Total Amount
                </span>
                <span className="text-xl font-black text-stitch-primary">
                  {formatCurrency(validation?.total || 0)}
                </span>
              </div>

              <p className="text-[11px] text-stitch-secondary-text text-right">
                Inclusive of all taxes
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isPlacingOrder}
              className="w-full h-14 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-md shadow-sm"
            >
              <MaterialIcon name="lock" size="sm" />
              <span>Pay {formatCurrency(validation?.total || 0)}</span>
            </Button>

            <div className="p-3.5 bg-white border border-stitch-border text-[11px] text-stitch-secondary-text rounded space-y-1">
              <div className="flex items-center gap-1.5 text-stitch-primary font-bold">
                <MaterialIcon name="verified" size="xs" className="text-stitch-accent" />
                <span>Verified Server Commitment</span>
              </div>
              <p>
                Store inventory is committed atomically upon cryptographic payment verification.
              </p>
            </div>
          </div>

          {/* Mobile Bottom Submit Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stitch-border p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] pb-[calc(16px+env(safe-area-inset-bottom))]">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isPlacingOrder}
              className="w-full h-14 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-md shadow-md"
            >
              <MaterialIcon name="lock" size="sm" />
              <span>Pay {formatCurrency(validation?.total || 0)}</span>
            </Button>
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
