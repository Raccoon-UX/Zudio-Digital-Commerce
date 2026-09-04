"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Badge } from "@/components/ui/Badge";
import { StoreStockAvailabilityDTO } from "@/modules/stores/types";
import { ReserveInStoreModal } from "@/components/store/ReserveInStoreModal";
import { formatCurrency } from "@/lib/utils";

export interface StoreAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  variantId?: string;
  productName: string;
  sizeName?: string;
  colorName?: string;
  imageUrl?: string;
  styleCode?: string;
  price?: number;
}

type FilterTab = "ALL" | "IN_STOCK" | "NEARBY";
type SortOption = "DISTANCE" | "STOCK" | "NAME";

export const StoreAvailabilityModal: React.FC<StoreAvailabilityModalProps> = ({
  isOpen,
  onClose,
  productId,
  variantId,
  productName,
  sizeName,
  colorName,
  imageUrl,
  styleCode,
  price,
}) => {
  const [stores, setStores] = useState<StoreStockAvailabilityDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("DISTANCE");
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Reservation sub-modal state
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [selectedStoreForReserve, setSelectedStoreForReserve] = useState<string | undefined>(undefined);

  const fetchStoreAvailability = useCallback(
    async (lat?: number, lng?: number) => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ productId });
      if (variantId) params.set("variantId", variantId);
      if (lat !== undefined && lng !== undefined) {
        params.set("lat", lat.toString());
        params.set("lng", lng.toString());
      }

      try {
        const res = await fetch(`/api/stores/availability?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.data) {
          setStores(data.data);
        } else {
          setError(data.error?.message || "Failed to load store availability.");
        }
      } catch (err) {
        console.error("Error fetching store availability:", err);
        setError("Unable to connect to store availability service. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [productId, variantId]
  );

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery("");
    setFilterTab("ALL");
    setLocationStatus(null);
    fetchStoreAvailability();
  }, [isOpen, fetchStoreAvailability]);

  // Handle Geolocation
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setLocationStatus("Location detected! Sorted by nearest stores.");
        setSortBy("DISTANCE");
        fetchStoreAvailability(position.coords.latitude, position.coords.longitude);
      },
      (geoError) => {
        setIsLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationStatus("Location permission denied. You can search by city name above.");
        } else {
          setLocationStatus("Unable to retrieve your location. Search by city instead.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleOpenReserve = (storeId?: string) => {
    setSelectedStoreForReserve(storeId);
    setIsReserveModalOpen(true);
  };

  // Filter and sort calculations
  const inStockCount = useMemo(
    () => stores.filter((s) => s.availableQuantity > 0).length,
    [stores]
  );

  const filteredAndSortedStores = useMemo(() => {
    let result = [...stores];

    // Search query filter (city, store name, address)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.city.toLowerCase().includes(q) ||
          s.storeName.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
      );
    }

    // Tab filter
    if (filterTab === "IN_STOCK") {
      result = result.filter((s) => s.availableQuantity > 0);
    } else if (filterTab === "NEARBY") {
      result = result.filter((s) => s.distanceKm != null && s.distanceKm <= 20);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "DISTANCE") {
        const distA = a.distanceKm ?? 9999;
        const distB = b.distanceKm ?? 9999;
        return distA - distB;
      }
      if (sortBy === "STOCK") {
        return b.availableQuantity - a.availableQuantity;
      }
      if (sortBy === "NAME") {
        return a.storeName.localeCompare(b.storeName);
      }
      return 0;
    });

    return result;
  }, [stores, searchQuery, filterTab, sortBy]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Container: Solid White, High Hierarchy, Stitch-Aligned */}
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden border border-neutral-200 animate-in zoom-in-95 duration-200 text-neutral-900">
          
          {/* Header Section */}
          <div className="p-5 sm:p-6 border-b border-neutral-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            {/* Left Header info */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-neutral-800 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full mb-1.5">
                <MaterialIcon name="storefront" size="xs" className="text-neutral-700" />
                <span>Physical Store Availability</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
                Check Store Availability
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Find nearby Zudio retail stores and real-time stock for instant 2-hour hold.
              </p>
            </div>

            {/* Right: Product Summary Card & Close */}
            <div className="flex items-center gap-3">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 flex items-center gap-3 max-w-xs">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={productName}
                    className="w-11 h-14 object-cover rounded-lg bg-neutral-200 shrink-0 border border-neutral-200"
                  />
                ) : (
                  <div className="w-11 h-14 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                    ZUDIO
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-tight text-neutral-900 truncate">
                    {productName}
                  </p>
                  {styleCode && (
                    <p className="text-[10px] font-mono text-neutral-500 truncate">
                      Style #{styleCode}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {colorName && (
                      <span className="text-[10px] font-semibold bg-white border border-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded">
                        {colorName}
                      </span>
                    )}
                    {sizeName && (
                      <span className="text-[10px] font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded">
                        Size: {sizeName}
                      </span>
                    )}
                    {price !== undefined && (
                      <span className="text-[10px] font-bold text-neutral-900 ml-auto">
                        {formatCurrency(price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors shrink-0"
                aria-label="Close dialog"
              >
                <MaterialIcon name="close" size="sm" />
              </button>
            </div>
          </div>

          {/* Search & Location Bar */}
          <div className="px-5 sm:px-6 pt-4 pb-3 bg-white border-b border-neutral-100 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center shrink-0">
            {/* Search input */}
            <div className="relative flex-1">
              <MaterialIcon
                name="search"
                size="sm"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by city (e.g. Bengaluru, Mumbai, Delhi) or store name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 text-neutral-900 placeholder:text-neutral-400 rounded-xl py-2.5 pl-10 pr-9 text-xs sm:text-sm font-medium transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
                >
                  <MaterialIcon name="close" size="xs" />
                </button>
              )}
            </div>

            {/* Geolocation "Use My Location" Button */}
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all shadow-sm shrink-0"
            >
              <MaterialIcon
                name={isLocating ? "sync" : "my_location"}
                size="xs"
                className={isLocating ? "animate-spin" : ""}
              />
              <span>{isLocating ? "Locating..." : "Use My Location"}</span>
            </button>
          </div>

          {/* Location Status Notice if active */}
          {locationStatus && (
            <div className="px-5 sm:px-6 py-2 bg-neutral-100 border-b border-neutral-200 text-xs text-neutral-700 flex items-center gap-2">
              <MaterialIcon name="info" size="xs" className="text-neutral-500 shrink-0" />
              <span>{locationStatus}</span>
            </div>
          )}

          {/* Filter Tabs & Sorting Toolbar */}
          <div className="px-5 sm:px-6 py-2.5 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterTab("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  filterTab === "ALL"
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                }`}
              >
                All Stores ({stores.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("IN_STOCK")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  filterTab === "IN_STOCK"
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                }`}
              >
                In Stock ({inStockCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("NEARBY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  filterTab === "NEARBY"
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                }`}
              >
                Near Me (&lt; 20 km)
              </button>
            </div>

            {/* Sort Dropdown & Result Count */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-white border border-neutral-300 text-neutral-900 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-neutral-900"
                >
                  <option value="DISTANCE">Nearest First</option>
                  <option value="STOCK">Highest Stock</option>
                  <option value="NAME">Store Name (A-Z)</option>
                </select>
              </div>

              <span className="text-[11px] text-neutral-500 font-medium hidden sm:inline">
                {filteredAndSortedStores.length} stores found
              </span>
            </div>
          </div>

          {/* Store List Body (Scrollable) */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1 bg-neutral-50/50">
            {isLoading ? (
              <div className="space-y-3.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-5 bg-white border border-neutral-200 rounded-xl space-y-3 animate-pulse shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <div className="h-5 w-48 bg-neutral-200 rounded" />
                      <div className="h-5 w-24 bg-neutral-200 rounded" />
                    </div>
                    <div className="h-4 w-72 bg-neutral-100 rounded" />
                    <div className="h-10 w-full bg-neutral-100 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-5 bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-3 rounded-xl">
                <MaterialIcon name="error" size="sm" className="shrink-0 text-rose-600" />
                <div>
                  <p className="font-bold">Error loading store availability</p>
                  <p className="text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
            ) : filteredAndSortedStores.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-xl border border-neutral-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <MaterialIcon name="store" size="md" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
                    No matching stores found
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? `We couldn't find any stores matching "${searchQuery}". Try searching for another city or store name.`
                      : "No stores match the selected filter criteria."}
                  </p>
                </div>
                {(searchQuery || filterTab !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterTab("ALL");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    <MaterialIcon name="refresh" size="xs" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>
            ) : (
              filteredAndSortedStores.map((store) => {
                const isAvailable = store.availableQuantity > 0;
                const isLowStock = store.stockStatus === "LOW_STOCK";

                return (
                  <div
                    key={store.storeId}
                    className="bg-white border border-neutral-200 hover:border-neutral-400 rounded-xl p-4 sm:p-5 transition-all shadow-sm hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Store Branding, Name, Status & Contact */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Store Icon Badge */}
                      <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                        <MaterialIcon name="storefront" size="xs" />
                        <span className="text-[8px] font-black tracking-tighter uppercase mt-0.5">
                          ZUDIO
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-neutral-900 truncate">
                            {store.storeName}
                          </h3>

                          {/* Status Badge */}
                          {store.stockStatus === "IN_STOCK" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>In Stock</span>
                            </span>
                          )}
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              <span>Low Stock</span>
                            </span>
                          )}
                          {store.stockStatus === "OUT_OF_STOCK" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-500 border border-neutral-200 px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                              <span>Out of Stock</span>
                            </span>
                          )}
                        </div>

                        {/* Address */}
                        <p className="text-xs text-neutral-600 flex items-start gap-1">
                          <MaterialIcon
                            name="location_on"
                            size="xs"
                            className="text-neutral-400 shrink-0 mt-0.5"
                          />
                          <span className="line-clamp-1">
                            {store.address}, {store.city}
                          </span>
                        </p>

                        {/* Operational Details: Hours & Phone */}
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-500 pt-0.5">
                          {store.openingHours && (
                            <span className="inline-flex items-center gap-1">
                              <MaterialIcon name="schedule" size="xs" className="text-neutral-400" />
                              <span>{store.openingHours}</span>
                            </span>
                          )}
                          {store.phone && (
                            <span className="inline-flex items-center gap-1">
                              <MaterialIcon name="call" size="xs" className="text-neutral-400" />
                              <span>{store.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Stock Availability Callout Card */}
                    <div className="shrink-0 lg:min-w-[200px]">
                      {isAvailable ? (
                        <div
                          className={`p-2.5 rounded-xl border ${
                            isLowStock
                              ? "bg-amber-50/80 border-amber-200 text-amber-950"
                              : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 text-xs font-bold ${
                              isLowStock ? "text-amber-800" : "text-emerald-800"
                            }`}
                          >
                            <MaterialIcon
                              name={isLowStock ? "warning" : "check_circle"}
                              size="xs"
                              className={isLowStock ? "text-amber-600" : "text-emerald-600"}
                            />
                            <span>
                              {isLowStock
                                ? `Only ${store.availableQuantity} Left In Stock!`
                                : `${store.availableQuantity} Units Available`}
                            </span>
                          </div>
                          <p
                            className={`text-[10px] mt-0.5 font-medium ${
                              isLowStock ? "text-amber-700" : "text-emerald-700"
                            }`}
                          >
                            Size {sizeName || "selected"} ready for 2-hour hold
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl border bg-neutral-100/80 border-neutral-200 text-neutral-600">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
                            <MaterialIcon name="cancel" size="xs" className="text-neutral-400" />
                            <span>Currently Out of Stock</span>
                          </div>
                          <p className="text-[10px] mt-0.5 text-neutral-400">
                            Size {sizeName || "selected"} unavailable at this store
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Distance & Reserve Action */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100">
                      {/* Distance */}
                      <div className="text-left lg:text-right">
                        {store.distanceKm !== null && store.distanceKm !== undefined ? (
                          <div className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900">
                            <MaterialIcon name="navigation" size="xs" className="text-neutral-500" />
                            <span>{store.distanceKm.toFixed(1)} km away</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400">Distance on map</span>
                        )}
                      </div>

                      {/* Action Button */}
                      {isAvailable ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReserve(store.storeId)}
                          className="inline-flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <MaterialIcon name="lock" size="xs" />
                          <span>Reserve in Store</span>
                          <MaterialIcon name="chevron_right" size="xs" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center gap-1 bg-neutral-100 text-neutral-400 border border-neutral-200 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl cursor-not-allowed"
                        >
                          <MaterialIcon name="block" size="xs" />
                          <span>Out of Stock</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Section */}
          <div className="p-4 sm:p-5 bg-white border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600 shrink-0">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <MaterialIcon name="schedule" size="sm" className="text-neutral-900 shrink-0" />
              <span>
                Hold window is strictly <strong>2 hours</strong> from reservation confirmation. Pay at counter during pickup.
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-xl transition-colors shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Reserve In-Store Modal */}
      {isReserveModalOpen && (
        <ReserveInStoreModal
          isOpen={isReserveModalOpen}
          onClose={() => {
            setIsReserveModalOpen(false);
            setSelectedStoreForReserve(undefined);
          }}
          productId={productId}
          variantId={variantId}
          productName={productName}
          sizeName={sizeName}
          colorName={colorName}
          defaultStoreId={selectedStoreForReserve}
        />
      )}
    </>
  );
};

export default StoreAvailabilityModal;

