export interface StoreDTO {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  openingHours: string | null;
  isActive: boolean;
  distanceKm?: number | null;
  directionsUrl: string;
}

export interface StoreInventoryItemDTO {
  variantId: string;
  productName: string;
  productSlug: string;
  sizeName: string;
  colorName: string;
  colorHex: string;
  price: number;
  imageUrl: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface StoreDetailDTO extends StoreDTO {
  inventoryCount: number;
  featuredInventory: StoreInventoryItemDTO[];
}

export interface StoreStockAvailabilityDTO {
  storeId: string;
  storeName: string;
  storeSlug: string;
  address: string;
  city: string;
  phone: string;
  openingHours: string | null;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}
