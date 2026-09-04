"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderDTO } from "@/modules/orders/types";

export default function OrdersPage() {
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authoritative server data fetcher
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setError(data.error?.message || "Failed to load orders.");
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError("Unable to connect to order service.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrders();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, fetchOrders]);

  if (status === "unauthenticated") {
    return (
      <div className="py-20 bg-[#FAFAFA] min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-white border border-stitch-border inline-flex items-center justify-center rounded-full mb-4 shadow-sm">
            <MaterialIcon name="inventory_2" size={32} className="text-neutral-700" />
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-tight text-black mb-2">
            Please Sign In
          </h2>
          <p className="text-xs text-neutral-500 mb-6 max-w-sm mx-auto">
            Sign in to view your full order history, live dispatch updates, and invoices.
          </p>
          <Link href="/login?callbackUrl=/orders">
            <Button variant="primary" size="md">
              Sign In to View Orders
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  const getStatusBadge = (orderStatus: string) => {
    switch (orderStatus) {
      case "ORDER_PLACED":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="schedule" size={12} className="text-amber-700" />
            <span>Order Placed</span>
          </span>
        );
      case "CONFIRMED":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 border border-neutral-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="inventory_2" size={12} className="text-neutral-700" />
            <span>Processing</span>
          </span>
        );
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return (
          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 border border-neutral-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="local_shipping" size={12} className="text-stitch-primary" />
            <span>In-Transit</span>
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="check_circle" size={12} className="text-emerald-700" />
            <span>Delivered</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
            <MaterialIcon name="cancel" size={12} className="text-rose-700" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px]">
            {orderStatus}
          </Badge>
        );
    }
  };

  return (
    <div className="py-10 bg-[#FAFAFA] min-h-screen">
      <Container size="lg">
        {/* Header */}
        <div className="pb-6 mb-8 border-b border-stitch-border flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              <Link href="/profile" className="hover:text-black transition-colors">Account</Link> / <span className="text-black font-semibold">Orders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              Order History
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchOrders()}
              className="p-2 text-neutral-500 hover:text-black border border-stitch-border bg-white rounded transition-colors"
              title="Refresh order statuses"
              aria-label="Refresh Orders"
            >
              <MaterialIcon name="refresh" size={16} />
            </button>
            <Link href="/products">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
                Explore Catalog
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-stitch-border rounded-lg p-6 space-y-4 shadow-sm">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-16 bg-white border border-stitch-border rounded-lg text-center p-8">
            <MaterialIcon name="error" size={36} className="text-rose-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold uppercase text-black mb-1">Failed to load orders</h3>
            <p className="text-xs text-neutral-500 mb-4">{error}</p>
            <Button variant="primary" size="sm" onClick={() => fetchOrders()}>
              Retry
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="You have not placed any orders yet. Start exploring our fashion collections to place your first order."
            iconName="inventory_2"
            actionLabel="Start Shopping"
            onAction={() => (window.location.href = "/products")}
          />
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-stitch-border rounded-lg shadow-sm overflow-hidden transition-colors hover:border-neutral-400"
              >
                {/* Order Top Bar */}
                <div className="bg-stitch-surface p-4 sm:px-6 border-b border-stitch-border flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                    <div>
                      <span className="text-neutral-500 uppercase text-[10px] font-bold block">
                        Order Number
                      </span>
                      <strong className="text-black font-mono font-bold text-sm">
                        {order.orderNumber}
                      </strong>
                    </div>

                    <div>
                      <span className="text-neutral-500 uppercase text-[10px] font-bold block">
                        Date Placed
                      </span>
                      <span className="text-neutral-800 font-medium">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500 uppercase text-[10px] font-bold block">
                        Total Amount
                      </span>
                      <span className="text-black font-bold">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="text-xs py-1 px-3 inline-flex items-center gap-1">
                        <span>View Details</span>
                        <MaterialIcon name="arrow_forward" size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="p-4 sm:p-6 divide-y divide-neutral-100">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <h4 className="font-bold uppercase tracking-wide text-black">
                          {item.productName}
                        </h4>
                        <p className="text-neutral-500 text-[11px]">
                          Size: <strong className="text-neutral-700">{item.sizeName}</strong> · Color: <strong className="text-neutral-700">{item.colorName}</strong> · Qty: <strong>{item.quantity}</strong>
                        </p>
                      </div>
                      <span className="font-bold text-black">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery Snapshot Footer */}
                {order.address && (
                  <div className="bg-neutral-50/70 px-4 sm:px-6 py-3 border-t border-stitch-border text-[11px] text-neutral-600 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <MaterialIcon name="location_on" size={14} className="text-neutral-500" />
                      <span>
                        Delivering to: <strong className="text-black">{order.address.fullName}</strong> ({order.address.city}, {order.address.pincode})
                      </span>
                    </div>
                    <span className="text-neutral-500 font-mono text-[10px]">
                      Payment: <strong className={order.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"}>{order.paymentStatus}</strong>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

