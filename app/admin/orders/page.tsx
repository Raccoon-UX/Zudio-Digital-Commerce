"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  Clock,
  X,
  CreditCard,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Order Detail Drawer State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleOpenDetail = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsLoadingDetail(true);
    setStatusError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrderDetail(data.data);
      }
    } catch (err) {
      console.error("Fetch order detail error:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async (targetStatus: string) => {
    if (!selectedOrderId) return;

    if (targetStatus === "CANCELLED") {
      if (!confirm("Are you sure you want to cancel this order? Committed inventory will be automatically restored to the fulfillment store.")) {
        return;
      }
    }

    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (data.success) {
        handleOpenDetail(selectedOrderId);
        fetchOrders();
      } else {
        setStatusError(data.error?.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Update status error:", err);
      setStatusError("Network error during status transition.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="success">Confirmed (Paid)</Badge>;
      case "PROCESSING":
        return <Badge variant="warning">Processing (Packed)</Badge>;
      case "SHIPPED":
        return <Badge variant="default">Shipped</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Delivered ✓</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Fulfillment Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Order Fulfillment & Payments
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          className="text-xs bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Orders
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`text-xs py-1 px-3 border transition-colors ${
                statusFilter === st
                  ? "bg-black text-white border-black font-bold"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-black"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrders();
          }}
          className="relative w-full md:w-80"
        >
          <input
            type="text"
            placeholder="Search by order #, customer, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-300 py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-black"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500 space-y-2">
            <ShoppingBag className="h-8 w-8 text-neutral-400 mx-auto" />
            <p className="font-bold uppercase text-black">No Orders Found</p>
            <p>No customer orders match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Fulfillment Store</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-black">{o.orderNumber}</td>
                    <td className="py-3 px-4">
                      <strong className="text-black block">{o.customerName}</strong>
                      <span className="text-[10px] text-neutral-400">{o.customerEmail}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{o.fulfillmentStore}</td>
                    <td className="py-3 px-4">{getStatusBadge(o.status)}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={o.paymentStatus === "PAID" ? "success" : "warning"}
                        className="text-[9px]"
                      >
                        {o.paymentStatus}
                      </Badge>
                      {o.razorpayPaymentId && (
                        <span className="block text-[9px] font-mono text-neutral-400 mt-0.5">
                          {o.razorpayPaymentId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-black">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="py-3 px-4 text-[10px] text-neutral-500">{formatDate(o.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(o.id)}
                        className="text-[10px] py-0.5 px-2.5"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOrderId(null)}
          />

          <div className="relative w-full max-w-2xl bg-white border border-neutral-200 p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto">
            {isLoadingDetail || !orderDetail ? (
              <div className="space-y-4 py-8">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">
                      Order Details
                    </span>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black font-mono">
                      {orderDetail.orderNumber}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(null)}
                    className="p-1 text-neutral-400 hover:text-black"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {statusError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{statusError}</span>
                  </div>
                )}

                {/* Status & Fulfillment Progression Actions */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-black">Current Status:</span>
                    {getStatusBadge(orderDetail.status)}
                  </div>

                  {/* Action progression buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {orderDetail.status === "CONFIRMED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isUpdatingStatus}
                        onClick={() => handleUpdateStatus("PROCESSING")}
                        className="text-xs"
                      >
                        <Package className="h-3.5 w-3.5 mr-1.5" />
                        Advance to Processing (Pack Items)
                      </Button>
                    )}

                    {orderDetail.status === "PROCESSING" && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isUpdatingStatus}
                        onClick={() => handleUpdateStatus("SHIPPED")}
                        className="text-xs bg-indigo-700 hover:bg-indigo-800"
                      >
                        <Truck className="h-3.5 w-3.5 mr-1.5" />
                        Advance to Shipped (Dispatch)
                      </Button>
                    )}

                    {orderDetail.status === "SHIPPED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isUpdatingStatus}
                        onClick={() => handleUpdateStatus("DELIVERED")}
                        className="text-xs bg-emerald-700 hover:bg-emerald-800"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Mark as Delivered
                      </Button>
                    )}

                    {(orderDetail.status === "CONFIRMED" || orderDetail.status === "PROCESSING") && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus("CANCELLED")}
                        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Cancel & Restore Inventory
                      </Button>
                    )}
                  </div>
                </div>

                {/* Razorpay Payment Verification Section */}
                <div className="bg-neutral-50 p-4 border border-neutral-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold uppercase text-black">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment Verification Status</span>
                  </div>

                  {orderDetail.payment ? (
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 pt-1">
                      <div>
                        Gateway: <strong className="text-black">{orderDetail.payment.gateway}</strong>
                      </div>
                      <div>
                        Status: <strong className="text-black">{orderDetail.payment.status}</strong>
                      </div>
                      <div>
                        Amount: <strong className="text-black">{formatCurrency(orderDetail.payment.amount)}</strong>
                      </div>
                      <div>
                        Payment Method: <strong className="text-black">{orderDetail.payment.paymentMethod || "UPI / Test"}</strong>
                      </div>
                      <div className="col-span-2 font-mono text-[10px]">
                        Razorpay Order ID: <span className="text-black">{orderDetail.payment.razorpayOrderId || "N/A"}</span>
                      </div>
                      <div className="col-span-2 font-mono text-[10px]">
                        Razorpay Payment ID: <span className="text-black">{orderDetail.payment.razorpayPaymentId || "N/A"}</span>
                      </div>
                      <div className="col-span-2 text-[10px]">
                        Verified At: <span className="text-black font-semibold">{orderDetail.payment.verifiedAt ? formatDate(orderDetail.payment.verifiedAt) : "Pending"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-xs">No payment record associated.</p>
                  )}
                </div>

                {/* Shipping Address */}
                {orderDetail.shippingAddress && (
                  <div className="text-xs space-y-1">
                    <span className="font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Shipping Address Snapshot
                    </span>
                    <p className="font-semibold text-black">{orderDetail.shippingAddress.fullName}</p>
                    <p className="text-neutral-600">
                      {orderDetail.shippingAddress.addressLine1}
                      {orderDetail.shippingAddress.addressLine2 ? `, ${orderDetail.shippingAddress.addressLine2}` : ""}
                    </p>
                    <p className="text-neutral-600">
                      {orderDetail.shippingAddress.city}, {orderDetail.shippingAddress.state} - <strong>{orderDetail.shippingAddress.pincode}</strong>
                    </p>
                    <p className="text-neutral-600">Phone: {orderDetail.shippingAddress.phone}</p>
                  </div>
                )}

                {/* Order Items Table */}
                <div className="space-y-2">
                  <span className="font-bold uppercase tracking-wider text-black text-xs block">
                    Order Items ({orderDetail.items.length})
                  </span>
                  <div className="divide-y divide-neutral-100 border border-neutral-200">
                    {orderDetail.items.map((item: any) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-black uppercase block">{item.productName}</strong>
                          <span className="text-neutral-500 text-[11px]">
                            {item.sizeName} · {item.colorName} · SKU: {item.variantSku}
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span>{item.quantity} &times; {formatCurrency(item.unitPrice)}</span>
                          <strong className="text-black block">{formatCurrency(item.subtotal)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-right text-xs space-y-0.5">
                    <p className="text-neutral-500">Subtotal: {formatCurrency(orderDetail.subtotal)}</p>
                    <p className="text-neutral-500">Delivery: {formatCurrency(orderDetail.deliveryFee)}</p>
                    <p className="text-base font-black text-black">Total: {formatCurrency(orderDetail.total)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
