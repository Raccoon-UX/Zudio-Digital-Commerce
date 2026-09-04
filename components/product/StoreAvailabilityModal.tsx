"use client";

import React, { useState, useEffect } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StoreStockAvailabilityDTO } from "@/modules/stores/types";
import { ReserveInStoreModal } from "@/components/store/ReserveInStoreModal";

interface StoreAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  variantId?: string;
  productName: string;
  sizeName?: string;
  colorName?: string;
}

export const StoreAvailabilityModal: React.FC<StoreAvailabilityModalProps> = ({
  isOpen,
  onClose,
  productId,
  variantId,
  productName,
  sizeName,
  colorName,
}) => {
  const [stores, setStores] = useState<StoreStockAvailabilityDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState("");
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const url = `/api/stores/availability?productId=${productId}${
      variantId ? `&variantId=${variantId}` : ""
    }`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setStores(data.data);
        } else {
          setError(data.error?.message || "Failed to load store availability.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error fetching store availability:", err);
        setError("Unable to connect to store availability service.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, productId, variantId]);

  if (!isOpen) return null;

  const filteredStores = stores.filter(
    (s) =>
      s.city.toLowerCase().includes(searchCity.toLowerCase()) ||
      s.storeName.toLowerCase().includes(searchCity.toLowerCase()) ||
      s.address.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="relative w-full max-w-2xl bg-stitch-surface-base border border-stitch-border rounded-sm shadow-2xl z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 text-stitch-primary">
          {/* Header */}
          <div className="p-6 border-b border-stitch-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-stitch-accent bg-stitch-surface-container px-2.5 py-0.5 rounded-sm border border-stitch-border mb-1.5">
                  <MaterialIcon name="storefront" size="xs" />
                  <span>Physical Store Availability</span>
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-stitch-primary">
                  In-Store Stock & Reservations
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-stitch-secondary-text hover:text-stitch-primary transition-colors"
              >
                <MaterialIcon name="close" size="sm" />
              </button>
            </div>

            <div className="mt-2 text-xs text-stitch-secondary-text">
              Checking stock for:{" "}
              <strong className="text-stitch-primary font-bold">{productName}</strong>
              {sizeName && colorName && (
                <span className="ml-1 text-stitch-secondary-text">
                  ({colorName} / Size: {sizeName})
                </span>
              )}
            </div>

            {/* City / Store Search */}
            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Search by city (e.g. Bengaluru, Mumbai, Delhi) or store name..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full bg-stitch-surface-container/50 border border-stitch-border py-2 pl-9 pr-3 text-xs rounded-sm text-stitch-primary focus:outline-none focus:border-stitch-primary transition-colors"
              />
              <MaterialIcon name="search" size="sm" className="absolute left-3 top-2.5 text-stitch-secondary-text pointer-events-none" />
            </div>
          </div>

          {/* Store List Body */}
          <div className="p-6 overflow-y-auto divide-y divide-stitch-border space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-2 space-y-2 animate-pulse">
                    <div className="h-4 w-1/3 bg-stitch-surface-container rounded" />
                    <div className="h-3 w-2/3 bg-stitch-surface-container rounded" />
                    <div className="h-3 w-1/4 bg-stitch-surface-container rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 bg-stitch-surface-container border border-stitch-error/30 text-xs text-stitch-error flex items-center gap-2 rounded-sm">
                <MaterialIcon name="error" size="sm" className="shrink-0" />
                <span>{error}</span>
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-8 text-stitch-secondary-text text-xs">
                No physical stores found matching "{searchCity}".
              </div>
            ) : (
              filteredStores.map((store) => (
                <div
                  key={store.storeId}
                  className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stitch-primary">
                        {store.storeName}
                      </h4>
                      {store.stockStatus === "IN_STOCK" && (
                        <Badge variant="accent" className="text-[9px]">
                          In Stock ({store.availableQuantity} available)
                        </Badge>
                      )}
                      {store.stockStatus === "LOW_STOCK" && (
                        <Badge variant="warning" className="text-[9px]">
                          Low Stock ({store.availableQuantity} left)
                        </Badge>
                      )}
                      {store.stockStatus === "OUT_OF_STOCK" && (
                        <Badge variant="danger" className="text-[9px]">
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    <p className="text-[11px] text-stitch-secondary-text flex items-start gap-1">
                      <MaterialIcon name="location_on" size="xs" className="text-stitch-secondary-text shrink-0 mt-0.5" />
                      <span>
                        {store.address}, {store.city}
                      </span>
                    </p>

                    <div className="flex items-center gap-4 text-[10px] text-stitch-secondary-text pt-0.5">
                      {store.openingHours && (
                        <span className="inline-flex items-center gap-1">
                          <MaterialIcon name="schedule" size="xs" />
                          <span>{store.openingHours}</span>
                        </span>
                      )}
                      {store.phone && (
                        <span className="inline-flex items-center gap-1">
                          <MaterialIcon name="call" size="xs" />
                          <span>{store.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reserve In-Store Action */}
                  <div className="sm:text-right shrink-0">
                    <Button
                      variant={store.availableQuantity > 0 ? "primary" : "outline"}
                      size="sm"
                      disabled={store.availableQuantity === 0}
                      onClick={() => {
                        onClose();
                        setIsReserveModalOpen(true);
                      }}
                      className="text-[10px] py-1 px-3"
                    >
                      {store.availableQuantity > 0 ? "Reserve in Store (2-Hr Hold)" : "Out of Stock"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-stitch-surface-container/30 border-t border-stitch-border flex items-center justify-between text-[11px] text-stitch-secondary-text">
            <span>Hold window is strictly 2 hours from confirmation.</span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Reserve In-Store Creation Modal */}
      {isReserveModalOpen && (
        <ReserveInStoreModal
          isOpen={isReserveModalOpen}
          onClose={() => setIsReserveModalOpen(false)}
          productId={productId}
          variantId={variantId}
          productName={productName}
          sizeName={sizeName}
          colorName={colorName}
        />
      )}
    </>
  );
};

export default StoreAvailabilityModal;

