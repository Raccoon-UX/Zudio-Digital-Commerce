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
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ReservationDTO } from "@/modules/reservations/types";

export default function CustomerReservationsPage() {
  const { data: session, status } = useSession();

  const [reservations, setReservations] = useState<ReservationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();
      if (data.success) {
        setReservations(data.data);
      } else {
        setError(data.error?.message || "Failed to load reservations.");
      }
    } catch (err) {
      console.error("Fetch reservations error:", err);
      setError("Unable to connect to reservation service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchReservations();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status]);

  if (status === "unauthenticated") {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <div className="p-4 bg-neutral-100 border border-neutral-200 inline-flex items-center justify-center mb-4">
            <MaterialIcon name="storefront" size={32} className="text-neutral-700" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-2">
            Please Sign In
          </h2>
          <p className="text-xs text-neutral-500 mb-6 max-w-sm mx-auto">
            Sign in to view your active in-store reservations and pickup passes.
          </p>
          <Link href="/login?callbackUrl=/reservations">
            <Button variant="primary" size="md">
              Sign In to View Reservations
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  const getStatusBadge = (resStatus: string) => {
    switch (resStatus) {
      case "CONFIRMED":
        return <Badge variant="default">Confirmed (Stock Held)</Badge>;
      case "READY_FOR_PICKUP":
        return <Badge variant="success">Ready for In-Store Pickup</Badge>;
      case "COLLECTED":
        return <Badge variant="success">Collected & Handed Over</Badge>;
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
      <Container size="lg">
        {/* Header */}
        <div className="pb-6 mb-8 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              <span>Home</span> / <span className="text-black">Reservations</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
              In-Store Reservations
            </h1>
          </div>
          <Link href="/stores">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
              Find Stores
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
        ) : reservations.length === 0 ? (
          <EmptyState
            title="No store reservations found"
            description="Reserve fashion styles at your local store for a 2-hour hold window and try before you buy."
            iconName="storefront"
            actionLabel="Explore Catalog"
            onAction={() => (window.location.href = "/products")}
          />
        ) : (
          <div className="space-y-6">
            {reservations.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-neutral-200 shadow-sm overflow-hidden"
              >
                {/* Top Bar */}
                <div className="bg-neutral-100/70 p-4 sm:px-6 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                    <div>
                      <span className="text-neutral-500 uppercase text-[10px] font-bold block">
                        Pickup Code
                      </span>
                      <strong className="text-black font-mono text-base font-black tracking-widest">
                        {res.pickupCode}
                      </strong>
                    </div>

                    <div>
                      <span className="text-neutral-500 uppercase text-[10px] font-bold block">
                        Store
                      </span>
                      <span className="text-black font-bold">
                        {res.store.name} ({res.store.city})
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500 uppercase text-[10px] font-bold block">
                        Reserved On
                      </span>
                      <span className="text-neutral-800">
                        {formatDate(res.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(res.status)}
                    <Link href={`/reservations/${res.id}`}>
                      <Button variant="outline" size="sm" className="text-xs py-1 px-3 inline-flex items-center gap-1">
                        <span>View Pickup Pass</span>
                        <MaterialIcon name="arrow_forward" size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Item Details */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold uppercase text-black">
                      {res.product.name}
                    </h4>
                    <p className="text-neutral-500">
                      Size: <strong>{res.product.sizeName}</strong> · Color:{" "}
                      <strong>{res.product.colorName}</strong> · Quantity: <strong>{res.quantity}</strong>
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      REF: {res.reservationNumber}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-black">
                      {formatCurrency(res.product.price)}
                    </span>
                    <p className="text-[10px] text-neutral-400">Pay at Store Counter</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
