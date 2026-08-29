export interface CartItemDTO {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  unitPrice: number;
  compareAtPrice: number | null;
  imageUrl: string;
  quantity: number;
  subtotal: number;
  maxAvailableQuantity: number;
  inStock: boolean;
}

export interface CartDTO {
  id: string;
  userId?: string | null;
  sessionToken?: string | null;
  items: CartItemDTO[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  amountNeededForFreeDelivery: number;
  discount: number;
  total: number;
}
