"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { StoreDetailDTO } from "@/modules/stores/types";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Phone, Clock, Navigation, ArrowLeft, AlertCircle, ShoppingBag } from "lucide-react";

export default function StoreDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<StoreDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetch(`/api/stores/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStore(data.data);
        } else {
          setError(data.error?.message || "Store not found.");
        }
      })
      .catch((err) => {
        console.error("Fetch store error:", err);
        setError("Unable to load store details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="py-12 bg-white min-h-screen">
        <Container size="xl" className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </Container>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="py-20 bg-white min-h-[60vh] flex items-center justify-center">
        <Container size="sm" className="text-center">
          <AlertCircle className="h-10 w-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold uppercase text-black mb-2">Store Not Found</h2>
          <p className="text-xs text-neutral-500 mb-6">{error || "The requested store location is unavailable."}</p>
          <Link href="/stores">
            <Button variant="primary" size="sm">
              Back to All Stores
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 bg-neutral-50 min-h-screen">
      <Container size="xl">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/stores"
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to All Stores
          </Link>
        </div>

        {/* Store Banner Card */}
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 shadow-sm mb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-[10px]">
                  Physical Store
                </Badge>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {store.city}, {store.state}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                {store.name}
              </h1>
            </div>

            <a
              href={store.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button variant="primary" size="md" className="text-xs font-bold uppercase tracking-wider">
                <Navigation className="h-4 w-4 mr-2" />
                Navigate in Google Maps
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-neutral-600">
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Address
              </span>
              <p>{store.address}</p>
              <p>{store.city}, {store.state} - <strong>{store.pincode}</strong></p>
            </div>

            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Opening Hours
              </span>
              <p>{store.openingHours || "10:00 AM - 10:00 PM Daily"}</p>
              <p className="text-[11px] text-emerald-700 font-semibold">Open 7 Days a Week</p>
            </div>

            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Contact
              </span>
              <p>
                Phone: <a href={`tel:${store.phone}`} className="hover:underline text-black font-medium">{store.phone}</a>
              </p>
              <p className="text-[11px] text-neutral-500">Call for in-store inquiries</p>
            </div>
          </div>
        </div>

        {/* Featured Store Stock Catalog */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-black">
                Available In-Store Inventory
              </h2>
              <p className="text-xs text-neutral-500">
                Explore styles currently stocked at this retail location
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="sm" className="text-xs">
                Explore Online Catalog
              </Button>
            </Link>
          </div>

          {store.featuredInventory.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-8 text-center text-xs text-neutral-500">
              No inventory catalog listed for this store location.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {store.featuredInventory.map((item) => (
                <div
                  key={item.variantId}
                  className="bg-white border border-neutral-200 p-3 space-y-2 hover:border-black transition-colors flex flex-col justify-between"
                >
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="relative aspect-[3/4] w-full bg-neutral-100 block overflow-hidden"
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="space-y-1">
                    <Link href={`/products/${item.productSlug}`}>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-black line-clamp-1 hover:underline">
                        {item.productName}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Size: {item.sizeName}</span>
                      <span className="font-black text-black">
                        {formatCurrency(item.price)}
                      </span>
                    </div>

                    <div className="pt-2">
                      <Link href={`/products/${item.productSlug}`}>
                        <Button variant="outline" size="sm" className="w-full text-[10px] py-1">
                          View & Reserve
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
