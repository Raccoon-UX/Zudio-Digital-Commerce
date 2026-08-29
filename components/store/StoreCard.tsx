import React from "react";
import Link from "next/link";
import { StoreDTO } from "@/modules/stores/types";
import { MapPin, Phone, Clock, Navigation, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface StoreCardProps {
  store: StoreDTO;
  onSelect?: (store: StoreDTO) => void;
  isSelected?: boolean;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  onSelect,
  isSelected = false,
}) => {
  return (
    <div
      className={`p-5 sm:p-6 bg-white border transition-all ${
        isSelected
          ? "border-black ring-1 ring-black shadow-md"
          : "border-neutral-200 hover:border-black shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {store.city}, {store.state}
          </span>
          <h3 className="text-base font-black uppercase tracking-tight text-black">
            {store.name}
          </h3>
        </div>

        {store.distanceKm !== undefined && store.distanceKm !== null && (
          <Badge variant="default" className="text-[10px] font-mono shrink-0">
            {store.distanceKm} km away
          </Badge>
        )}
      </div>

      <div className="space-y-2 text-xs text-neutral-600 mb-6">
        <div className="flex items-start gap-2">
          <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <span>
            {store.address} - <strong>{store.pincode}</strong>
          </span>
        </div>

        {store.openingHours && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <span>Open Today: {store.openingHours}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          <a href={`tel:${store.phone}`} className="hover:underline text-black font-medium">
            {store.phone}
          </a>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
        <a
          href={store.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-black hover:underline"
        >
          <Navigation className="h-3.5 w-3.5 mr-1" />
          Get Directions
        </a>

        {onSelect ? (
          <Button
            variant={isSelected ? "primary" : "outline"}
            size="sm"
            onClick={() => onSelect(store)}
            className="text-xs"
          >
            {isSelected ? "Selected Store" : "Select Store"}
          </Button>
        ) : (
          <Link href={`/stores/${store.slug}`}>
            <Button variant="outline" size="sm" className="text-xs">
              <span>View Store</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default StoreCard;
