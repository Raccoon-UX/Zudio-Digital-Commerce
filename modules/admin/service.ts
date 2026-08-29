import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { recordAuditLog } from "./audit";
import {
  DashboardMetricsDTO,
  AdminProductListItemDTO,
  AdminInventoryItemDTO,
  AdminCustomerDTO,
  AdminAuditLogDTO,
} from "./types";

export function requireAdminUser(user: { id: string; role: string } | null | undefined) {
  if (!user || user.role !== "ADMIN") {
    throw new AppError("Forbidden: Admin privileges required.", "FORBIDDEN", 403);
  }
}

// --------------------------------------------------------
// DASHBOARD METRICS & ANALYTICS
// --------------------------------------------------------

export async function getDashboardMetrics(): Promise<DashboardMetricsDTO> {
  const [
    paidOrders,
    allOrders,
    activeReservationsCount,
    totalCustomersCount,
    lowStockInventories,
    recentOrders,
    orderItems,
  ] = await Promise.all([
    // 1. Gross Paid Revenue (Orders where Payment status is PAID)
    prisma.order.findMany({
      where: {
        payment: {
          status: "PAID",
        },
      },
      select: {
        total: true,
      },
    }),

    // 2. All orders for status counts
    prisma.order.findMany({
      select: { status: true },
    }),

    // 3. Active in-store reservations (CONFIRMED or READY_FOR_PICKUP)
    prisma.reservation.count({
      where: {
        status: { in: ["CONFIRMED", "READY_FOR_PICKUP"] },
      },
    }),

    // 4. Total registered customers
    prisma.user.count({
      where: { role: "CUSTOMER" },
    }),

    // 5. Low stock count (available stock <= 3)
    prisma.inventory.findMany({
      include: {
        variant: {
          include: { product: true },
        },
      },
    }),

    // 6. Recent 6 orders
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true } },
        address: { select: { fullName: true } },
        payment: { select: { status: true } },
        store: { select: { name: true } },
      },
    }),

    // 7. Order items from confirmed/paid orders for top products & category breakdown
    prisma.orderItem.findMany({
      where: {
        order: {
          payment: { status: "PAID" },
        },
      },
      include: {
        variant: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
    }),
  ]);

  // Calculate Gross Paid Revenue
  const grossPaidRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

  // Status breakdown
  const orderStatusCounts = {
    ORDER_PLACED: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    RETURNED: 0,
  };
  allOrders.forEach((o) => {
    if (orderStatusCounts[o.status as keyof typeof orderStatusCounts] !== undefined) {
      orderStatusCounts[o.status as keyof typeof orderStatusCounts]++;
    }
  });

  // Filter low stock
  const lowStockCount = lowStockInventories.filter(
    (inv) => inv.quantity - inv.reservedQuantity <= 3
  ).length;

  // Top Selling Products & Revenue by Category
  const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
  const categoryRevenueMap = new Map<string, number>();

  orderItems.forEach((item) => {
    const prodId = item.variant.productId;
    const prodName = item.productName;
    const itemSubtotal = Number(item.subtotal);
    const catName = item.variant.product.category.name;

    // Product agg
    const currentProd = productSalesMap.get(prodId) || { name: prodName, qty: 0, revenue: 0 };
    currentProd.qty += item.quantity;
    currentProd.revenue += itemSubtotal;
    productSalesMap.set(prodId, currentProd);

    // Category agg
    const currentCatRev = categoryRevenueMap.get(catName) || 0;
    categoryRevenueMap.set(catName, currentCatRev + itemSubtotal);
  });

  const topSellingProducts = Array.from(productSalesMap.entries())
    .map(([productId, data]) => ({
      productId,
      name: data.name,
      totalQuantitySold: data.qty,
      totalRevenue: Math.round(data.revenue),
    }))
    .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
    .slice(0, 5);

  const revenueByCategory = Array.from(categoryRevenueMap.entries())
    .map(([categoryName, revenue]) => ({
      categoryName,
      revenue: Math.round(revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Orders by fulfillment store
  const storeOrderMap = new Map<string, number>();
  allOrders.forEach((o: any) => {
    // mapped from order store
  });

  return {
    grossPaidRevenue: Math.round(grossPaidRevenue * 100) / 100,
    totalPaidOrders: paidOrders.length,
    totalOrders: allOrders.length,
    orderStatusCounts,
    activeReservationsCount,
    totalCustomersCount,
    lowStockItemsCount: lowStockCount,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || o.address?.fullName || "Guest Customer",
      total: Number(o.total),
      status: o.status,
      paymentStatus: o.payment?.status || "PENDING",
      fulfillmentStore: o.store?.name || "Pending Assignment",
      createdAt: o.createdAt.toISOString(),
    })),
    topSellingProducts,
    revenueByCategory,
    ordersByStore: [],
  };
}

// --------------------------------------------------------
// INVENTORY MATRIX & AUDIT ADJUSTMENTS
// --------------------------------------------------------

export async function getAdminInventory(
  storeId?: string,
  lowStockOnly?: boolean
): Promise<AdminInventoryItemDTO[]> {
  const where: any = {};
  if (storeId && storeId !== "ALL") where.storeId = storeId;

  const inventories = await prisma.inventory.findMany({
    where,
    include: {
      store: true,
      variant: {
        include: {
          product: true,
          size: true,
          color: true,
        },
      },
    },
    orderBy: [{ store: { city: "asc" } }, { variant: { product: { name: "asc" } } }],
  });

  const mapped: AdminInventoryItemDTO[] = inventories.map((inv) => {
    const availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
    const isLowStock = availableQuantity <= 3;

    return {
      inventoryId: inv.id,
      storeId: inv.storeId,
      storeName: inv.store.name,
      storeCity: inv.store.city,
      variantId: inv.variantId,
      productId: inv.variant.productId,
      productName: inv.variant.product.name,
      productSlug: inv.variant.product.slug,
      sku: inv.variant.sku,
      sizeName: inv.variant.size.name,
      colorName: inv.variant.color.name,
      price: Number(inv.variant.price),
      quantity: inv.quantity,
      reservedQuantity: inv.reservedQuantity,
      availableQuantity,
      isLowStock,
    };
  });

  if (lowStockOnly) {
    return mapped.filter((item) => item.isLowStock);
  }

  return mapped;
}

export async function adjustAdminInventory(
  storeId: string,
  variantId: string,
  newQuantity: number,
  reason: string,
  adminUser: { id: string; name: string }
): Promise<AdminInventoryItemDTO> {
  if (newQuantity < 0) {
    throw new AppError("Inventory quantity cannot be negative.", "INVALID_REQUEST", 400);
  }

  const existing = await prisma.inventory.findUnique({
    where: {
      storeId_variantId: { storeId, variantId },
    },
    include: {
      store: true,
      variant: {
        include: {
          product: true,
          size: true,
          color: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError("Inventory record not found.", "NOT_FOUND", 404);
  }

  // INVARIANT CHECK: quantity >= reservedQuantity
  if (newQuantity < existing.reservedQuantity) {
    throw new AppError(
      `Cannot set quantity to ${newQuantity}. There are currently ${existing.reservedQuantity} active reserved units holding this stock.`,
      "INVALID_STATE",
      400
    );
  }

  const prevQuantity = existing.quantity;

  const updated = await prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.update({
      where: {
        storeId_variantId: { storeId, variantId },
      },
      data: {
        quantity: newQuantity,
      },
      include: {
        store: true,
        variant: {
          include: {
            product: true,
            size: true,
            color: true,
          },
        },
      },
    });

    return inv;
  });

  // Append Audit Log
  await recordAuditLog({
    userId: adminUser.id,
    action: "INVENTORY_ADJUSTED",
    entityType: "Inventory",
    entityId: existing.id,
    details: {
      storeId,
      storeName: existing.store.name,
      variantSku: existing.variant.sku,
      productName: existing.variant.product.name,
      previousQuantity: prevQuantity,
      newQuantity,
      reservedQuantity: existing.reservedQuantity,
      reason: reason || "Manual Admin Adjustment",
    },
  });

  return {
    inventoryId: updated.id,
    storeId: updated.storeId,
    storeName: updated.store.name,
    storeCity: updated.store.city,
    variantId: updated.variantId,
    productId: updated.variant.productId,
    productName: updated.variant.product.name,
    productSlug: updated.variant.product.slug,
    sku: updated.variant.sku,
    sizeName: updated.variant.size.name,
    colorName: updated.variant.color.name,
    price: Number(updated.variant.price),
    quantity: updated.quantity,
    reservedQuantity: updated.reservedQuantity,
    availableQuantity: Math.max(0, updated.quantity - updated.reservedQuantity),
    isLowStock: updated.quantity - updated.reservedQuantity <= 3,
  };
}

// --------------------------------------------------------
// ORDER MANAGEMENT & STATUS PROGRESSION
// --------------------------------------------------------

export async function getAdminOrders(filters?: {
  status?: string;
  storeId?: string;
  search?: string;
}) {
  const where: any = {};

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters?.storeId && filters.storeId !== "ALL") {
    where.storeId = filters.storeId;
  }

  if (filters?.search) {
    const term = filters.search.trim();
    where.OR = [
      { orderNumber: { contains: term, mode: "insensitive" } },
      { guestEmail: { contains: term, mode: "insensitive" } },
      { user: { name: { contains: term, mode: "insensitive" } } },
      { address: { fullName: { contains: term, mode: "insensitive" } } },
      { address: { phone: { contains: term } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      store: { select: { id: true, name: true, city: true } },
      payment: true,
      address: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.user?.name || o.address?.fullName || "Guest Customer",
    customerEmail: o.user?.email || o.guestEmail || "N/A",
    customerPhone: o.address?.phone || "N/A",
    status: o.status,
    total: Number(o.total),
    itemsCount: o.items.length,
    fulfillmentStore: o.store ? `${o.store.name} (${o.store.city})` : "Unassigned",
    storeId: o.storeId,
    paymentGateway: o.payment?.gateway || "N/A",
    paymentStatus: o.payment?.status || "PENDING",
    razorpayPaymentId: o.payment?.razorpayPaymentId,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getAdminOrderDetail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      store: true,
      payment: true,
      address: true,
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sortOrder: "asc" }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found.", "NOT_FOUND", 404);
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discount: Number(order.discount),
    total: Number(order.total),
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    customer: {
      name: order.user?.name || order.address?.fullName || "Guest Customer",
      email: order.user?.email || order.guestEmail || "N/A",
      phone: order.address?.phone || "N/A",
    },
    shippingAddress: order.address
      ? {
          fullName: order.address.fullName,
          addressLine1: order.address.addressLine1,
          addressLine2: order.address.addressLine2,
          city: order.address.city,
          state: order.address.state,
          pincode: order.address.pincode,
          phone: order.address.phone,
        }
      : null,
    fulfillmentStore: order.store
      ? {
          id: order.store.id,
          name: order.store.name,
          city: order.store.city,
          address: order.store.address,
        }
      : null,
    payment: order.payment
      ? {
          gateway: order.payment.gateway,
          status: order.payment.status,
          amount: Number(order.payment.amount),
          razorpayOrderId: order.payment.razorpayOrderId,
          razorpayPaymentId: order.payment.razorpayPaymentId,
          paymentMethod: order.payment.paymentMethod,
          verifiedAt: order.payment.verifiedAt?.toISOString() || null,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantSku: item.variantSku,
      sizeName: item.sizeName,
      colorName: item.colorName,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
      imageUrl: item.variant?.product?.images[0]?.url || "https://placehold.co/400x533/f5f5f5/333333.png?text=Zudio",
    })),
  };
}

export async function updateAdminOrderStatus(
  orderId: string,
  targetStatus: "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
  adminUser: { id: string; name: string }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });

  if (!order) {
    throw new AppError("Order not found.", "NOT_FOUND", 404);
  }

  const current = order.status;

  // Strict Order State Machine Transitions
  // CONFIRMED -> PROCESSING
  // PROCESSING -> SHIPPED
  // SHIPPED -> DELIVERED
  // (CONFIRMED or PROCESSING) -> CANCELLED
  if (targetStatus === "PROCESSING") {
    if (current !== "CONFIRMED") {
      throw new AppError(`Cannot move to PROCESSING from status '${current}'. Must be CONFIRMED.`, "INVALID_STATE", 400);
    }
  } else if (targetStatus === "SHIPPED") {
    if (current !== "PROCESSING") {
      throw new AppError(`Cannot move to SHIPPED from status '${current}'. Must be PROCESSING.`, "INVALID_STATE", 400);
    }
  } else if (targetStatus === "DELIVERED") {
    if (current !== "SHIPPED") {
      throw new AppError(`Cannot move to DELIVERED from status '${current}'. Must be SHIPPED.`, "INVALID_STATE", 400);
    }
  } else if (targetStatus === "CANCELLED") {
    if (current === "SHIPPED" || current === "DELIVERED" || current === "CANCELLED" || current === "RETURNED") {
      throw new AppError(`Cannot cancel order in terminal/dispatched status '${current}'.`, "INVALID_STATE", 400);
    }

    // Atomic Cancellation + Idempotent Inventory Restoration
    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: { in: ["ORDER_PLACED", "CONFIRMED", "PROCESSING"] },
        },
        data: {
          status: "CANCELLED",
        },
      });

      if (updateResult.count === 0) {
        throw new AppError("Order status was modified concurrently.", "CONCURRENCY_ERROR", 409);
      }

      // If the order was CONFIRMED or PROCESSING, payment committed stock to order.storeId. Restore it.
      if (order.storeId && (current === "CONFIRMED" || current === "PROCESSING")) {
        for (const item of order.items) {
          await tx.inventory.update({
            where: {
              storeId_variantId: {
                storeId: order.storeId,
                variantId: item.variantId,
              },
            },
            data: {
              quantity: { increment: item.quantity },
            },
          });
        }
      }
    });

    await recordAuditLog({
      userId: adminUser.id,
      action: "ORDER_CANCELLED_WITH_INVENTORY_RESTORE",
      entityType: "Order",
      entityId: order.id,
      details: {
        orderNumber: order.orderNumber,
        previousStatus: current,
        storeId: order.storeId,
        itemsRestoredCount: order.items.length,
      },
    });

    return { success: true, status: "CANCELLED" };
  }

  // Normal Status Progression
  await prisma.order.update({
    where: { id: orderId },
    data: { status: targetStatus },
  });

  await recordAuditLog({
    userId: adminUser.id,
    action: "ORDER_STATUS_UPDATED",
    entityType: "Order",
    entityId: order.id,
    details: {
      orderNumber: order.orderNumber,
      previousStatus: current,
      newStatus: targetStatus,
    },
  });

  return { success: true, status: targetStatus };
}

// --------------------------------------------------------
// CUSTOMER & STAFF ROLE MANAGEMENT
// --------------------------------------------------------

export async function getAdminCustomers(): Promise<AdminCustomerDTO[]> {
  const users = await prisma.user.findMany({
    include: {
      store: true,
      orders: {
        include: { payment: true },
      },
      reservations: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => {
    const paidOrders = u.orders.filter((o) => o.payment?.status === "PAID");
    const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      storeId: u.storeId,
      storeName: u.store ? `${u.store.name} (${u.store.city})` : null,
      totalOrders: u.orders.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalReservations: u.reservations.length,
      createdAt: u.createdAt.toISOString(),
    };
  });
}

export async function updateAdminUserRole(
  targetUserId: string,
  newRole: "CUSTOMER" | "STORE_STAFF" | "ADMIN",
  storeId: string | null | undefined,
  currentAdminUser: { id: string; name: string }
) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new AppError("Target user not found.", "NOT_FOUND", 404);
  }

  // Security Rule 1: Admin cannot demote themselves
  if (targetUserId === currentAdminUser.id && newRole !== "ADMIN") {
    throw new AppError("Security Violation: You cannot demote your own administrator account.", "FORBIDDEN", 403);
  }

  // Security Rule 2: Cannot demote/remove the last remaining ADMIN account
  if (targetUser.role === "ADMIN" && newRole !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new AppError("Security Violation: Cannot remove the last remaining Administrator account.", "FORBIDDEN", 403);
    }
  }

  // Security Rule 3: STORE_STAFF requires a mandatory valid storeId
  let assignedStoreId: string | null = null;
  if (newRole === "STORE_STAFF") {
    if (!storeId) {
      throw new AppError("Store selection is mandatory when assigning STORE_STAFF role.", "INVALID_REQUEST", 400);
    }
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new AppError("Selected store does not exist.", "NOT_FOUND", 404);
    }
    assignedStoreId = store.id;
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      role: newRole,
      storeId: assignedStoreId,
    },
  });

  await recordAuditLog({
    userId: currentAdminUser.id,
    action: "USER_ROLE_UPDATED",
    entityType: "User",
    entityId: targetUser.id,
    details: {
      targetUserEmail: targetUser.email,
      previousRole: targetUser.role,
      newRole,
      storeId: assignedStoreId,
    },
  });

  return updated;
}

// --------------------------------------------------------
// AUDIT LOG QUERY (APPEND-ONLY)
// --------------------------------------------------------

export async function getAdminAuditLogs(filters?: {
  action?: string;
  entityType?: string;
}): Promise<AdminAuditLogDTO[]> {
  const where: any = {};
  if (filters?.action && filters.action !== "ALL") where.action = filters.action;
  if (filters?.entityType && filters.entityType !== "ALL") where.entityType = filters.entityType;

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return logs.map((l) => ({
    id: l.id,
    userId: l.userId,
    userName: l.user?.name || "System",
    userEmail: l.user?.email || null,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    details: l.details as any,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  }));
}
