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
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  PackageCheck,
  Store,
  Phone,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ReservationDTO } from "@/modules/reservations/types";

export default function StaffReservationsPortal() {
  const { data: session, status } = useSession();

  const [reservations, setReservations] = useState<ReservationDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const fetchStaffReservations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/staff/reservations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReservations(data.data);
      }
    } catch (err) {
      console.error("Fetch staff reservations error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchStaffReservations();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status, statusFilter]);

  const handleUpdateStatus = async (
    reservationId: string,
    targetStatus: "READY_FOR_PICKUP" | "COLLECTED" | "CANCELLED"
  ) => {
    setActionInProgressId(reservationId);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (data.success) {
        fetchStaffReservations();
      } else {
        alert(data.error?.message || "Failed to update reservation status.");
      }
    } catch (err) {
      console.error("Update status error:", err);
      alert("Network error during status update.");
    } finally {
      setActionInProgressId(null);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-neutral-100 border border-neutral-200 inline-block rounded-full mb-4">
            <ShieldCheck className="h-8 w-8 text-neutral-600" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-2">
            Staff Authentication Required
          </h2>
          <p className="text-xs text-neutral-500 mb-6 max-w-sm mx-auto">
            Please sign in with your Store Staff or Admin credentials to access the POS reservation portal.
          </p>
          <Link href="/login?callbackUrl=/staff/reservations">
            <Button variant="primary" size="md">
              Sign In as Staff
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  const filteredReservations = reservations.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.pickupCode.toLowerCase().includes(term) ||
      r.reservationNumber.toLowerCase().includes(term) ||
      r.customerName.toLowerCase().includes(term) ||
      (r.customerPhone && r.customerPhone.includes(term))
    );
  });

  const getStatusBadge = (resStatus: string) => {
    switch (resStatus) {
      case "CONFIRMED":
        return <Badge variant="warning">Confirmed (Stock Held)</Badge>;
      case "READY_FOR_PICKUP":
        return <Badge variant="default">Ready for Pickup</Badge>;
      case "COLLECTED":
        return <Badge variant="success">Collected ✓</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      case "EXPIRED":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{resStatus}</Badge>;
    }
  };

  return (
    <div className="py-10 bg-neutral-50 min-h-screen">
      <Container size="xl">
        {/* Header Banner */}
        <div className="bg-black text-white p-6 sm:p-8 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white px-2 py-0.5">
                Staff Portal
              </span>
              <span className="text-xs text-neutral-400">
                POS In-Store Pickup Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Store Reservations Dashboard
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStaffReservations}
            className="text-xs bg-white text-black hover:bg-neutral-200"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh Reservations
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-neutral-200 p-4 sm:p-6 mb-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by Pickup Code (e.g. ZUD-7K9P), customer name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 py-2.5 pl-4 pr-10 text-xs focus:outline-none focus:border-black font-mono"
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-neutral-400" />
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "CONFIRMED", "READY_FOR_PICKUP", "COLLECTED", "CANCELLED", "EXPIRED"].map((st) => (
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
          </div>
        </div>

        {/* Reservations Table / Cards List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-neutral-200 p-6 space-y-3">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-12 text-center space-y-3">
            <Store className="h-8 w-8 text-neutral-400 mx-auto" />
            <h3 className="text-sm font-bold uppercase text-black">No Store Reservations Found</h3>
            <p className="text-xs text-neutral-500">
              No matching reservations found for your store location.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((r) => {
              const isConfirmed = r.status === "CONFIRMED";
              const isReady = r.status === "READY_FOR_PICKUP";
              const isProcessing = actionInProgressId === r.id;

              return (
                <div
                  key={r.id}
                  className={`bg-white border p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all ${
                    isReady ? "border-black ring-1 ring-black" : "border-neutral-200"
                  }`}
                >
                  {/* Left: Code, Product, Customer */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xl font-black tracking-widest text-black bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                        {r.pickupCode}
                      </span>
                      {getStatusBadge(r.status)}
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {r.reservationNumber}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-700">
                      <h4 className="font-bold uppercase text-black text-sm">
                        {r.product.name}
                      </h4>
                      <p>
                        Size: <strong>{r.product.sizeName}</strong> · Color:{" "}
                        <strong>{r.product.colorName}</strong> · Qty: <strong>{r.quantity}</strong> ·{" "}
                        <strong>{formatCurrency(r.product.price)}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-1">
                      <span>Customer: <strong className="text-black">{r.customerName}</strong></span>
                      {r.customerPhone && (
                        <span>Phone: <a href={`tel:${r.customerPhone}`} className="underline text-black font-semibold">{r.customerPhone}</a></span>
                      )}
                      <span>Expires: {formatDate(r.expiresAt)}</span>
                    </div>
                  </div>

                  {/* Right: Staff Workflow Actions */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-neutral-100">
                    {isConfirmed && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isProcessing}
                        onClick={() => handleUpdateStatus(r.id, "READY_FOR_PICKUP")}
                        className="text-xs bg-black text-white"
                      >
                        <PackageCheck className="h-3.5 w-3.5 mr-1.5" />
                        Mark Ready for Pickup
                      </Button>
                    )}

                    {isReady && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isProcessing}
                        onClick={() => handleUpdateStatus(r.id, "COLLECTED")}
                        className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Complete Handover (Collected)
                      </Button>
                    )}

                    {(isConfirmed || isReady) && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleUpdateStatus(r.id, "CANCELLED")}
                        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Cancel / No-Show
                      </Button>
                    )}

                    <Link href={`/reservations/${r.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Slip
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
