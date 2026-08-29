export type ReservationStatusType =
  | "PENDING"
  | "CONFIRMED"
  | "READY_FOR_PICKUP"
  | "COLLECTED"
  | "CANCELLED"
  | "EXPIRED";

export interface ReservationDTO {
  id: string;
  reservationNumber: string;
  pickupCode: string;
  guestToken: string | null;
  userId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  store: {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    openingHours: string | null;
    latitude: number;
    longitude: number;
    directionsUrl: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    variantId: string;
    sku: string;
    sizeName: string;
    colorName: string;
    colorHex: string;
    price: number;
  };
  quantity: number;
  status: ReservationStatusType;
  expiresAt: string;
  collectedAt: string | null;
  notes: string | null;
  createdAt: string;
  isExpired: boolean;
  remainingSeconds: number;
}

export interface CreateReservationInput {
  storeId: string;
  variantId: string;
  quantity?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  notes?: string;
}
