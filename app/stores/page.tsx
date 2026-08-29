"use client";

import React, { useState, useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { StoreCard } from "@/components/store/StoreCard";
import { StoreLocatorMap } from "@/components/store/StoreLocatorMap";
import { StoreDTO } from "@/modules/stores/types";
import { Search, MapPin, Navigation, Compass, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function StoresPage() {
  const [stores, setStores] = useState<StoreDTO[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<StoreDTO | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchStores = async (city?: string, search?: string, coords?: { lat: number; lng: number }) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (city && city !== "ALL") params.set("city", city);
      if (search && search.trim()) params.set("search", search.trim());
      if (coords) {
        params.set("lat", coords.lat.toString());
        params.set("lng", coords.lng.toString());
      }

      const res = await fetch(`/api/stores?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStores(data.data.stores);
        setCities(data.data.cities);
        if (data.data.stores.length > 0) {
          setSelectedStore(data.data.stores[0]);
        } else {
          setSelectedStore(null);
        }
      }
    } catch (err) {
      console.error("Fetch stores error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(selectedCity, searchTerm, userCoords || undefined);
  }, [selectedCity]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStores(selectedCity, searchTerm, userCoords || undefined);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setIsLocating(false);
        fetchStores(selectedCity, searchTerm, coords);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setIsLocating(false);
        alert("Unable to retrieve your location. Please check browser permissions.");
      }
    );
  };

  return (
    <div className="py-10 bg-neutral-50 min-h-screen">
      <Container size="xl">
        {/* Header */}
        <div className="pb-6 mb-8 border-b border-neutral-200">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
            <span>Home</span> / <span className="text-black">Stores</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Physical Store Locator
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Locate everyday fashion stores across India, view store-level availability, and reserve styles for 2-hour in-store pickup.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-neutral-200 p-4 sm:p-6 mb-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearch} className="relative flex-1">
              <input
                type="text"
                placeholder="Search by store name, address, or pincode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 py-2.5 pl-4 pr-10 text-xs focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                className="absolute right-3 top-3 text-neutral-400 hover:text-black"
                aria-label="Search stores"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            <Button
              type="button"
              variant="outline"
              size="md"
              isLoading={isLocating}
              onClick={handleUseMyLocation}
              className="text-xs shrink-0"
            >
              <Compass className="h-4 w-4 mr-1.5" />
              Find Stores Near Me
            </Button>
          </div>

          {/* City Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1">
              Filter City:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCity("ALL")}
              className={`text-xs py-1 px-3 border transition-colors ${
                selectedCity === "ALL"
                  ? "bg-black text-white border-black font-bold"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-black"
              }`}
            >
              All Cities
            </button>
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`text-xs py-1 px-3 border transition-colors ${
                  selectedCity === city
                    ? "bg-black text-white border-black font-bold"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-black"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Store Cards List */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
              <span>{stores.length} Retail Stores Found</span>
              {userCoords && <span>Sorted by Nearest Distance</span>}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-neutral-200 p-6 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : stores.length === 0 ? (
              <div className="bg-white border border-neutral-200 p-12 text-center space-y-3">
                <MapPin className="h-8 w-8 text-neutral-400 mx-auto" />
                <h3 className="text-sm font-bold uppercase text-black">No Stores Found</h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Try clearing your search query or choosing a different city filter.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCity("ALL");
                    setSearchTerm("");
                  }}
                  className="text-xs"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              stores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  isSelected={selectedStore?.id === store.id}
                  onSelect={(s) => setSelectedStore(s)}
                />
              ))
            )}
          </div>

          {/* Right Column: Interactive Store Locator Map */}
          <div className="lg:col-span-6 sticky top-28">
            <StoreLocatorMap
              stores={stores}
              selectedStore={selectedStore}
              onSelectStore={(s) => setSelectedStore(s)}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
