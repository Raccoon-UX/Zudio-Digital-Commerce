export type OrderStatusType =
  | "ORDER_PLACED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatusType =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface OrderItemDTO {
  id: string;
  variantId: string;
  productName: string;
  variantSku: string;
  sizeName: string;
  colorName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderAddressDTO {
  id: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface FulfillmentStoreDTO {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  guestToken: string | null;
  userId: string | null;
  guestEmail: string | null;
  storeId: string | null;
  fulfillmentStore: FulfillmentStoreDTO | null;
  status: OrderStatusType;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  itemCount: number;
  notes: string | null;
  address: OrderAddressDTO | null;
  items: OrderItemDTO[];
  paymentStatus: PaymentStatusType;
  paymentDetails?: {
    gateway: string;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    verifiedAt?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutValidationResultDTO {
  isValid: boolean;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  allocatedStore: {
    storeId: string;
    storeName: string;
    city: string;
  } | null;
  items: {
    variantId: string;
    productName: string;
    sizeName: string;
    colorName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    inStock: boolean;
    availableStock: number;
  }[];
  outOfStockItems: string[];
}

export interface CreateOrderInput {
  addressId?: string;
  guestAddress?: {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  notes?: string;
}
