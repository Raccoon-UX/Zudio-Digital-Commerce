import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import {
  StoreDTO,
  StoreDetailDTO,
  StoreStockAvailabilityDTO,
  StoreInventoryItemDTO,
} from "./types";

/**
 * Calculates great-circle distance between two coordinate pairs in kilometers using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function buildDirectionsUrl(lat: number, lng: number, address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(
    address
  )}`;
}

export async function getStores(filters?: {
  search?: string;
  city?: string;
  state?: string;
  pincode?: string;
  userLat?: number;
  userLng?: number;
}): Promise<StoreDTO[]> {
  const where: any = { isActive: true };

  if (filters?.city) {
    where.city = { equals: filters.city.trim(), mode: "insensitive" };
  }

  if (filters?.state) {
    where.state = { equals: filters.state.trim(), mode: "insensitive" };
  }

  if (filters?.pincode) {
    where.pincode = { startsWith: filters.pincode.trim() };
  }

  if (filters?.search) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { city: { contains: term, mode: "insensitive" } },
      { address: { contains: term, mode: "insensitive" } },
      { pincode: { contains: term, mode: "insensitive" } },
    ];
  }

  const stores = await prisma.store.findMany({
    where,
    orderBy: { name: "asc" },
  });

  const mapped: StoreDTO[] = stores.map((store) => {
    let distanceKm: number | null = null;
    if (filters?.userLat && filters?.userLng) {
      distanceKm = calculateDistanceKm(
        filters.userLat,
        filters.userLng,
        store.latitude,
        store.longitude
      );
    }

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      address: store.address,
      city: store.city,
      state: store.state,
      pincode: store.pincode,
      latitude: store.latitude,
      longitude: store.longitude,
      phone: store.phone,
      openingHours: store.openingHours,
      isActive: store.isActive,
      distanceKm,
      directionsUrl: buildDirectionsUrl(store.latitude, store.longitude, store.address),
    };
  });

  // Sort by distance if user coords are present
  if (filters?.userLat && filters?.userLng) {
    mapped.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  return mapped;
}

export async function getStoreBySlug(slug: string): Promise<StoreDetailDTO | null> {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      inventories: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sortOrder: "asc" }, take: 1 },
                },
              },
              size: true,
              color: true,
            },
          },
        },
        take: 12,
      },
    },
  });

  if (!store || !store.isActive) {
    return null;
  }

  const featuredInventory: StoreInventoryItemDTO[] = store.inventories.map((inv) => {
    const availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
    let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
    if (availableQuantity === 0) stockStatus = "OUT_OF_STOCK";
    else if (availableQuantity <= 3) stockStatus = "LOW_STOCK";

    return {
      variantId: inv.variant.id,
      productName: inv.variant.product.name,
      productSlug: inv.variant.product.slug,
      sizeName: inv.variant.size.name,
      colorName: inv.variant.color.name,
      colorHex: inv.variant.color.hexCode,
      price: Number(inv.variant.price),
      imageUrl: inv.variant.product.images[0]?.url || "https://placehold.co/400x533/f5f5f5/333333.png?text=Zudio",
      quantity: inv.quantity,
      reservedQuantity: inv.reservedQuantity,
      availableQuantity,
      stockStatus,
    };
  });

  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    address: store.address,
    city: store.city,
    state: store.state,
    pincode: store.pincode,
    latitude: store.latitude,
    longitude: store.longitude,
    phone: store.phone,
    openingHours: store.openingHours,
    isActive: store.isActive,
    directionsUrl: buildDirectionsUrl(store.latitude, store.longitude, store.address),
    inventoryCount: store.inventories.length,
    featuredInventory,
  };
}

export async function getProductAvailabilityByStore(
  productId: string,
  variantId?: string,
  userLat?: number,
  userLng?: number
): Promise<StoreStockAvailabilityDTO[]> {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    include: {
      inventories: {
        where: variantId
          ? { variantId }
          : { variant: { productId } },
        include: {
          variant: true,
        },
      },
    },
    orderBy: { city: "asc" },
  });

  const results: StoreStockAvailabilityDTO[] = stores.map((store) => {
    const totalQty = store.inventories.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalReserved = store.inventories.reduce((sum, inv) => sum + inv.reservedQuantity, 0);
    const availableQuantity = Math.max(0, totalQty - totalReserved);

    let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
    if (availableQuantity === 0) stockStatus = "OUT_OF_STOCK";
    else if (availableQuantity <= 3) stockStatus = "LOW_STOCK";

    let distanceKm: number | null = null;
    if (userLat && userLng) {
      distanceKm = calculateDistanceKm(userLat, userLng, store.latitude, store.longitude);
    }

    return {
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,
      address: store.address,
      city: store.city,
      phone: store.phone,
      openingHours: store.openingHours,
      latitude: store.latitude,
      longitude: store.longitude,
      distanceKm,
      quantity: totalQty,
      reservedQuantity: totalReserved,
      availableQuantity,
      stockStatus,
    };
  });

  if (userLat && userLng) {
    results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  return results;
}

export const getProductStoreAvailability = getProductAvailabilityByStore;

export async function getStoreCities(): Promise<string[]> {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });

  return stores.map((s) => s.city);
}
