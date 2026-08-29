"use client";

import React from "react";
import Image from "next/image";
import { ReservationDTO } from "@/modules/reservations/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Phone,
  QrCode,
  Store,
  Navigation,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReservationCountdown } from "./ReservationCountdown";

interface ReservationSlipProps {
  reservation: ReservationDTO;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export const ReservationSlip: React.FC<ReservationSlipProps> = ({
  reservation,
  onCancel,
  isCancelling = false,
}) => {
  const getStatusBadge = () => {
    switch (reservation.status) {
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
        return <Badge variant="secondary">{reservation.status}</Badge>;
    }
  };

  const isActive =
    reservation.status === "CONFIRMED" || reservation.status === "READY_FOR_PICKUP";

  return (
    <div className="bg-white border-2 border-black max-w-xl mx-auto shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="bg-black text-white p-6 text-center space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Zudio Digital Commerce · Concept Pilot
        </span>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-mono">
          IN-STORE PICKUP PASS
        </h2>
        <div className="pt-2 flex justify-center">
          {getStatusBadge()}
        </div>
      </div>

      {/* Countdown Timer for Active Reservations */}
      {isActive && (
        <ReservationCountdown
          expiresAt={reservation.expiresAt}
          isExpired={reservation.isExpired}
        />
      )}

      {/* Main Ticket Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Pickup Code Display */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Show this code at store counter
          </span>
          <div className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-black">
            {reservation.pickupCode}
          </div>
          <p className="text-[10px] text-neutral-400 font-mono">
            REF: {reservation.reservationNumber}
          </p>
        </div>

        {/* Product Summary */}
        <div className="flex items-center gap-4 p-4 border border-neutral-200">
          <div className="relative aspect-[3/4] w-20 bg-neutral-100 shrink-0 overflow-hidden border border-neutral-200">
            <Image
              src={reservation.product.imageUrl}
              alt={reservation.product.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          <div className="space-y-1 text-xs">
            <span className="font-bold uppercase tracking-wide text-black block">
              {reservation.product.name}
            </span>
            <p className="text-neutral-600">
              Size: <strong>{reservation.product.sizeName}</strong> · Color:{" "}
              <strong>{reservation.product.colorName}</strong>
            </p>
            <p className="text-neutral-500 font-mono text-[10px]">
              SKU: {reservation.product.sku}
            </p>
            <p className="text-sm font-black text-black pt-1">
              {formatCurrency(reservation.product.price)} (Qty: {reservation.quantity})
            </p>
          </div>
        </div>

        {/* Store Pickup Location */}
        <div className="space-y-2 text-xs border-t border-neutral-100 pt-4">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-black">
            <Store className="h-4 w-4" />
            <span>{reservation.store.name}</span>
          </div>

          <div className="pl-6 space-y-1 text-neutral-600">
            <p>{reservation.store.address}, {reservation.store.city} - {reservation.store.pincode}</p>
            {reservation.store.openingHours && (
              <p className="text-[11px] text-neutral-500">
                Hours: {reservation.store.openingHours}
              </p>
            )}
            <p className="text-[11px] text-neutral-500">
              Store Phone: <a href={`tel:${reservation.store.phone}`} className="underline text-black font-semibold">{reservation.store.phone}</a>
            </p>
          </div>

          <div className="pl-6 pt-2">
            <a
              href={reservation.store.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-black hover:underline"
            >
              <Navigation className="h-3.5 w-3.5 mr-1" />
              Navigate with Google Maps
            </a>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-neutral-50 p-4 border border-neutral-200 text-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
            Customer Contact
          </span>
          <p className="font-bold text-black">{reservation.customerName}</p>
          {reservation.customerPhone && (
            <p className="text-neutral-600">Phone: {reservation.customerPhone}</p>
          )}
        </div>

        {/* Action Buttons */}
        {isActive && onCancel && (
          <div className="pt-4 border-t border-neutral-200 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              isLoading={isCancelling}
              onClick={onCancel}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-400"
            >
              Cancel Reservation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationSlip;
