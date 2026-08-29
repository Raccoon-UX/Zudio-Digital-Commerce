export interface DashboardMetricsDTO {
  grossPaidRevenue: number;
  totalPaidOrders: number;
  totalOrders: number;
  orderStatusCounts: {
    ORDER_PLACED: number;
    CONFIRMED: number;
    PROCESSING: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
    RETURNED: number;
  };
  activeReservationsCount: number;
  totalCustomersCount: number;
  lowStockItemsCount: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    paymentStatus: string;
    fulfillmentStore: string | null;
    createdAt: string;
  }[];
  topSellingProducts: {
    productId: string;
    name: string;
    totalQuantitySold: number;
    totalRevenue: number;
  }[];
  revenueByCategory: {
    categoryName: string;
    revenue: number;
  }[];
  ordersByStore: {
    storeName: string;
    orderCount: number;
  }[];
}

export interface AdminProductListItemDTO {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  variantCount: number;
  totalStock: number;
  imageUrl: string;
  createdAt: string;
}

export interface AdminInventoryItemDTO {
  inventoryId: string;
  storeId: string;
  storeName: string;
  storeCity: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  sizeName: string;
  colorName: string;
  price: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  isLowStock: boolean;
}

export interface AdminCustomerDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "STORE_STAFF" | "ADMIN";
  storeId: string | null;
  storeName: string | null;
  totalOrders: number;
  totalSpent: number;
  totalReservations: number;
  createdAt: string;
}

export interface AdminAuditLogDTO {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}
