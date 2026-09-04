"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ReservationSlip } from "@/components/reservation/ReservationSlip";
import { ReservationDTO } from "@/modules/reservations/types";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export default function ReservationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reservationId = params.id as string;
  const guestToken = searchParams.get("guestToken") || undefined;

  const [reservation, setReservation] = useState<ReservationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = guestToken
        ? `/api/reservations/${reservationId}?guestToken=${guestToken}`
        : `/api/reservations/${reservationId}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setReservation(data.data);
      } else {
        setError(data.error?.message || "Reservation not found.");
      }
    } catch (err) {
      console.error("Fetch reservation error:", err);
      setError("Unable to connect to reservation service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, [reservationId, guestToken]);

  const handleCancelReservation = async () => {
    if (!confirm("Are you sure you want to cancel this in-store reservation? The held item will be released.")) {
      return;
    }

    setIsCancelling(true);
    try {
      const url = guestToken
        ? `/api/reservations/${reservationId}?guestToken=${guestToken}`
        : `/api/reservations/${reservationId}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        fetchReservation();
      } else {
        alert(data.error?.message || "Failed to cancel reservation.");
      }
    } catch (err) {
      console.error("Cancel reservation error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 bg-white min-h-screen">
        <Container size="sm" className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-96 w-full" />
        </Container>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <MaterialIcon name="error" size={40} className="text-rose-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold uppercase text-black mb-2">Reservation Not Found</h2>
          <p className="text-xs text-neutral-500 mb-6">{error || "The requested reservation could not be retrieved."}</p>
          <Link href="/reservations">
            <Button variant="primary" size="sm">
              Back to Reservations
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 bg-neutral-100 min-h-screen">
      <Container size="md">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/reservations"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
          >
            <MaterialIcon name="arrow_back" size={16} />
            <span>Back to Reservations</span>
          </Link>

          <Link href="/products">
            <Button variant="outline" size="sm" className="text-xs">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Digital Pickup Pass Slip */}
        <ReservationSlip
          reservation={reservation}
          onCancel={handleCancelReservation}
          isCancelling={isCancelling}
        />
      </Container>
    </div>
  );
}
