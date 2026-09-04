"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StoreStockAvailabilityDTO } from "@/modules/stores/types";

interface ReserveInStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  variantId?: string;
  productName: string;
  sizeName?: string;
  colorName?: string;
}

export const ReserveInStoreModal: React.FC<ReserveInStoreModalProps> = ({
  isOpen,
  onClose,
  productId,
  variantId,
  productName,
  sizeName,
  colorName,
}) => {
  const { data: session } = useSession();
  const router = useRouter();

  const [stores, setStores] = useState<StoreStockAvailabilityDTO[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingStores(true);
    setError(null);

    const query = new URLSearchParams({ productId });
    if (variantId) query.set("variantId", variantId);

    // Request geolocation if available for distance sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          query.set("lat", pos.coords.latitude.toString());
          query.set("lng", pos.coords.longitude.toString());
          fetchStores(query.toString());
        },
        () => fetchStores(query.toString())
      );
    } else {
      fetchStores(query.toString());
    }
  }, [isOpen, productId, variantId]);

  const fetchStores = async (qs: string) => {
    try {
      const res = await fetch(`/api/stores/availability?${qs}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStores(data.data);
        const firstInStock = data.data.find((s: StoreStockAvailabilityDTO) => s.availableQuantity > 0);
        if (firstInStock) {
          setSelectedStoreId(firstInStock.storeId);
        }
      }
    } catch (err) {
      console.error("Fetch store availability error:", err);
      setError("Unable to load store availability.");
    } finally {
      setIsLoadingStores(false);
    }
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) {
      setError("Please select a store with available stock.");
      return;
    }

    if (!variantId) {
      setError("Please select a size and color before reserving.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        storeId: selectedStoreId,
        variantId,
        quantity: 1,
        notes,
      };

      if (!session?.user) {
        if (!guestName || !guestPhone) {
          setError("Please enter your name and phone number.");
          setIsSubmitting(false);
          return;
        }
        payload.guestName = guestName;
        payload.guestEmail = guestEmail;
        payload.guestPhone = guestPhone;
      }

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        onClose();
        router.push(`/reservations/${data.data.id}`);
      } else {
        setError(data.error?.message || "Failed to create reservation.");
      }
    } catch (err) {
      console.error("Create reservation error:", err);
      setError("Network error while creating in-store reservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedStore = stores.find((s) => s.storeId === selectedStoreId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-neutral-200 p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <MaterialIcon name="storefront" size={20} className="text-black" />
            <h3 className="text-sm font-black uppercase tracking-wider text-black">
              Reserve in Store (2-Hour Hold)
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-neutral-400 hover:text-black transition-colors" aria-label="Close dialog">
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div className="py-2 text-xs text-neutral-600 space-y-1">
          <p className="font-bold text-black uppercase">{productName}</p>
          <p className="text-neutral-500">
            Selected: <strong>{sizeName || "Default Size"}</strong> · <strong>{colorName || "Default Color"}</strong>
          </p>
        </div>

        {/* 2-Hour Policy Banner */}
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <MaterialIcon name="schedule" size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-[11px] leading-normal">
            <span className="font-bold uppercase tracking-wider">2-Hour Hold Policy:</span>
            <p>
              Your item will be held in-store for <strong>2 hours</strong> from confirmation. Unclaimed reservations expire and release stock automatically.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <MaterialIcon name="error" size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitReservation} className="space-y-4 pt-2 text-xs">
          {/* Store Selector List */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-black mb-2">
              Select Store for Pickup *
            </label>

            {isLoadingStores ? (
              <div className="p-6 text-center text-neutral-400 text-xs">Checking store stock...</div>
            ) : stores.length === 0 ? (
              <div className="p-4 bg-neutral-50 border border-neutral-200 text-center text-neutral-500 text-xs">
                No stores currently stocking this variant.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {stores.map((s) => {
                  const isAvailable = s.availableQuantity > 0;
                  return (
                    <label
                      key={s.storeId}
                      className={`p-3 border block cursor-pointer transition-colors ${
                        selectedStoreId === s.storeId
                          ? "border-black bg-neutral-50"
                          : isAvailable
                          ? "border-neutral-200 hover:border-neutral-400"
                          : "border-neutral-200 bg-neutral-100/50 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="storeSelect"
                            disabled={!isAvailable}
                            checked={selectedStoreId === s.storeId}
                            onChange={() => setSelectedStoreId(s.storeId)}
                            className="text-black focus:ring-black"
                          />
                          <div>
                            <span className="font-bold uppercase text-black">{s.storeName}</span>
                            <p className="text-[11px] text-neutral-500">{s.city} {s.distanceKm ? `· ${s.distanceKm} km` : ""}</p>
                          </div>
                        </div>

                        {s.stockStatus === "IN_STOCK" && (
                          <Badge variant="success" className="text-[9px]">
                            In Stock ({s.availableQuantity})
                          </Badge>
                        )}
                        {s.stockStatus === "LOW_STOCK" && (
                          <Badge variant="warning" className="text-[9px]">
                            Low Stock ({s.availableQuantity})
                          </Badge>
                        )}
                        {s.stockStatus === "OUT_OF_STOCK" && (
                          <Badge variant="danger" className="text-[9px]">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer Details Form (if guest) */}
          {!session?.user && (
            <div className="space-y-3 pt-2 border-t border-neutral-200">
              <span className="font-bold uppercase tracking-wider text-black block">
                Pickup Contact Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 py-1.5 px-3 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 py-1.5 px-3 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Email (Optional for digital pass)
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 py-1.5 px-3 focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!selectedStoreId || stores.length === 0}
            >
              Confirm 2-Hour Reservation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReserveInStoreModal;
