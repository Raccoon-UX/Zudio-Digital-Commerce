"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, ArrowRight, Clock, CheckCircle2, Truck, AlertCircle } from "lucide-react";
import { OrderDTO } from "@/modules/orders/types";

export default function OrdersPage() {
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
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
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrders();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status]);

  if (status === "unauthenticated") {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-neutral-100 border border-neutral-200 inline-block rounded-full mb-4">
            <Package className="h-8 w-8 text-neutral-600" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-2">
            Please Sign In
          </h2>
          <p className="text-xs text-neutral-500 mb-6 max-w-sm mx-auto">
            Sign in to view your order history, delivery statuses, and invoices.
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
        return <Badge variant="warning">Order Placed</Badge>;
      case "CONFIRMED":
        return <Badge variant="default">Confirmed</Badge>;
      case "SHIPPED":
        return <Badge variant="secondary">Shipped</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{orderStatus}</Badge>;
    }
  };

  return (
    <div className="py-10 bg-neutral-50 min-h-screen">
      <Container size="lg">
        {/* Header */}
        <div className="pb-6 mb-8 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              <span>Home</span> / <span className="text-black">Orders</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Order History
            </h1>
          </div>
          <Link href="/products">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
              Explore Catalog
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-neutral-200 p-6 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="You have not placed any orders yet. Start exploring our collections to place your first order."
            icon={Package}
            actionLabel="Start Shopping"
            onAction={() => (window.location.href = "/products")}
          />
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-neutral-200 shadow-sm overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="bg-neutral-100/70 p-4 sm:px-6 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                    <div>
                      <span className="text-neutral-500 uppercase text-[10px] font-bold block">
                        Order Number
                      </span>
                      <strong className="text-black font-mono font-bold">
                        {order.orderNumber}
                      </strong>
                    </div>

                    <div>
                      <span className="text-neutral-500 uppercase text-[10px] font-bold block">
                        Date Placed
                      </span>
                      <span className="text-neutral-800">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500 uppercase text-[10px] font-bold block">
                        Total Amount
                      </span>
                      <span className="text-black font-black">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="text-xs py-1 px-3">
                        View Details
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
                        <h4 className="font-bold uppercase text-black">
                          {item.productName}
                        </h4>
                        <p className="text-neutral-500 text-[11px]">
                          Size: {item.sizeName} · Color: {item.colorName} · Qty: {item.quantity}
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
                  <div className="bg-neutral-50 px-4 sm:px-6 py-3 border-t border-neutral-100 text-[11px] text-neutral-500 flex items-center justify-between">
                    <span>
                      Delivering to: <strong className="text-black">{order.address.fullName}</strong> ({order.address.city}, {order.address.pincode})
                    </span>
                    <span className="text-neutral-400 font-mono">
                      Payment: {order.paymentStatus}
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
