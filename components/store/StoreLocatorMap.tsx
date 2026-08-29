"use client";

import React from "react";
import { StoreDTO } from "@/modules/stores/types";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface StoreLocatorMapProps {
  stores: StoreDTO[];
  selectedStore: StoreDTO | null;
  onSelectStore: (store: StoreDTO) => void;
}

export const StoreLocatorMap: React.FC<StoreLocatorMapProps> = ({
  stores,
  selectedStore,
  onSelectStore,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const activeStore = selectedStore || stores[0];

  if (!activeStore) {
    return (
      <div className="h-full min-h-[400px] bg-neutral-100 border border-neutral-200 flex items-center justify-center p-8 text-center">
        <p className="text-xs text-neutral-500 uppercase tracking-wider">
          No stores available to display on map.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[450px] w-full bg-neutral-900 border border-neutral-200 overflow-hidden flex flex-col justify-between p-6 text-white shadow-inner">
      {/* Map visual background */}
      <div
        className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />

      {/* Top Banner with Coordinates */}
      <div className="relative z-10 flex items-center justify-between bg-black/80 backdrop-blur-md p-3 border border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-white" />
          <span className="font-bold uppercase tracking-wider">
            {activeStore.name} ({activeStore.city})
          </span>
        </div>
        <span className="font-mono text-[10px] text-neutral-400">
          {activeStore.latitude.toFixed(4)}° N, {activeStore.longitude.toFixed(4)}° E
        </span>
      </div>

      {/* Center Interactive Visual Pins */}
      <div className="relative z-10 my-auto py-10 flex flex-wrap items-center justify-center gap-4">
        {stores.map((store) => {
          const isCurrent = store.id === activeStore.id;
          return (
            <button
              key={store.id}
              type="button"
              onClick={() => onSelectStore(store)}
              className={`p-3 text-left border transition-all ${
                isCurrent
                  ? "bg-white text-black border-white shadow-xl scale-105"
                  : "bg-neutral-800/80 text-white border-neutral-700 hover:border-neutral-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className={`h-3.5 w-3.5 ${isCurrent ? "text-black" : "text-neutral-400"}`} />
                <span className="text-xs font-black uppercase tracking-tight">
                  {store.name}
                </span>
              </div>
              <p className={`text-[10px] pl-5.5 ${isCurrent ? "text-neutral-600" : "text-neutral-400"}`}>
                {store.city} {store.distanceKm ? `· ${store.distanceKm} km` : ""}
              </p>
            </button>
          );
        })}
      </div>

      {/* Bottom Action Drawer */}
      <div className="relative z-10 bg-black/90 backdrop-blur-md p-4 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs space-y-0.5">
          <p className="font-bold uppercase text-white">{activeStore.address}</p>
          <p className="text-neutral-400 text-[11px]">
            {activeStore.city}, {activeStore.state} - {activeStore.pincode}
          </p>
        </div>

        <a
          href={activeStore.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block shrink-0"
        >
          <Button variant="outline" size="sm" className="w-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-200">
            <Navigation className="h-3.5 w-3.5 mr-1.5" />
            Open in Google Maps
          </Button>
        </a>
      </div>
    </div>
  );
};

export default StoreLocatorMap;
