import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import {
  OrderDTO,
  CheckoutValidationResultDTO,
  CreateOrderInput,
  OrderStatusType,
  PaymentStatusType,
} from "./types";
import { getCart } from "@/modules/cart/service";
import { generateOrderNumber } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/constants";
import { allocateFulfillmentStore } from "./fulfillment-allocator";

export async function validateCheckout(
  userId?: string | null,
  sessionToken?: string | null,
  deliveryCity?: string
): Promise<CheckoutValidationResultDTO> {
  const cart = await getCart(userId, sessionToken);

  if (cart.items.length === 0) {
    throw new AppError("Your shopping cart is empty.", "INVALID_REQUEST", 400);
  }

  // Batch query all variants for cart items in a single roundtrip
  const variantIds = cart.items.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: true,
      size: true,
      color: true,
      inventories: true,
    },
  });

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const outOfStockItems: string[] = [];
  const validatedItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const variant = variantMap.get(item.variantId);

    if (!variant || !variant.isActive || !variant.product.isActive) {
      outOfStockItems.push(`${item.productName} (${item.size}/${item.color}) - Discontinued`);
      continue;
    }

    const availableStock = variant.inventories.reduce(
      (sum, inv) => sum + Math.max(0, inv.quantity - inv.reservedQuantity),
      0
    );

    const unitPrice = Number(variant.price);
    const lineSubtotal = unitPrice * item.quantity;
    subtotal += lineSubtotal;

    const inStock = availableStock >= item.quantity;
    if (!inStock) {
      outOfStockItems.push(
        `${variant.product.name} (Size: ${variant.size.name}) - Only ${availableStock} available`
      );
    }

    validatedItems.push({
      variantId: variant.id,
      productName: variant.product.name,
      sizeName: variant.size.name,
      colorName: variant.color.name,
      unitPrice,
      quantity: item.quantity,
      subtotal: lineSubtotal,
      inStock,
      availableStock,
    });
  }

  // Attempt store allocation
  let allocatedStore = null;
  if (outOfStockItems.length === 0 && validatedItems.length > 0) {
    try {
      allocatedStore = await allocateFulfillmentStore(
        validatedItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        deliveryCity
      );
    } catch (e: any) {
      outOfStockItems.push("No single physical store has complete stock for all items in your bag.");
    }
  }

  const freeDeliveryThreshold = APP_CONFIG.freeDeliveryThreshold;
  const standardDeliveryFee = APP_CONFIG.deliveryFee;
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : standardDeliveryFee;
  const discount = 0;
  const total = subtotal + deliveryFee - discount;

  return {
    isValid: outOfStockItems.length === 0 && validatedItems.length > 0 && allocatedStore !== null,
    itemCount: validatedItems.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    deliveryFee,
    discount,
    total,
    allocatedStore,
    items: validatedItems,
    outOfStockItems,
  };
}

export async function createOrder(
  input: CreateOrderInput,
  userId?: string | null,
  sessionToken?: string | null
): Promise<OrderDTO> {
  try {
    // 1. Resolve Delivery Address first to determine delivery city for store allocation
    let addressData: {
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      pincode: string;
    };
    let guestEmail: string | null = null;

    if (userId) {
      if (input.addressId) {
        const savedAddress = await prisma.address.findFirst({
          where: { id: input.addressId, userId },
        });
        if (!savedAddress) {
          throw new AppError("Selected address not found in your address book.", "INVALID_REQUEST", 404);
        }
        addressData = {
          fullName: savedAddress.fullName,
          phone: savedAddress.phone,
          addressLine1: savedAddress.addressLine1,
          addressLine2: savedAddress.addressLine2,
          city: savedAddress.city,
          state: savedAddress.state,
          pincode: savedAddress.pincode,
        };
      } else if (input.guestAddress) {
        addressData = {
          fullName: input.guestAddress.fullName.trim(),
          phone: input.guestAddress.phone.trim(),
          addressLine1: input.guestAddress.addressLine1.trim(),
          addressLine2: input.guestAddress.addressLine2 ? input.guestAddress.addressLine2.trim() : null,
          city: input.guestAddress.city.trim(),
          state: input.guestAddress.state.trim(),
          pincode: input.guestAddress.pincode.trim(),
        };
      } else {
        throw new AppError("Delivery address is required.", "INVALID_REQUEST", 400);
      }
    } else {
      if (!input.guestAddress) {
        throw new AppError("Guest contact and delivery address are required.", "INVALID_REQUEST", 400);
      }

      const { email, phone, fullName, addressLine1, city, state, pincode } = input.guestAddress;
      if (!email || !email.includes("@") || !phone || !fullName || !addressLine1 || !city || !state || !pincode) {
        throw new AppError("Please provide all required guest contact and address fields.", "INVALID_REQUEST", 400);
      }

      guestEmail = email.trim().toLowerCase();
      addressData = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: input.guestAddress.addressLine2 ? input.guestAddress.addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      };
    }

    // 2. Perform server-side validation & store allocation
    const validation = await validateCheckout(userId, sessionToken, addressData.city);

    if (!validation.isValid || !validation.allocatedStore) {
      throw new AppError(
        `Unable to complete order: ${validation.outOfStockItems.join(", ")}`,
        "OUT_OF_STOCK",
        400,
        { outOfStockItems: validation.outOfStockItems }
      );
    }

    const orderNumber = generateOrderNumber();
    const guestToken = !userId ? crypto.randomBytes(16).toString("hex") : null;

    // 3. Atomic Order Creation in Prisma Transaction
    const orderRecord = await prisma.$transaction(async (tx) => {
      // Create Order with allocated fulfillment store
      const order = await tx.order.create({
        data: {
          orderNumber,
          guestToken,
          userId: userId || null,
          guestEmail,
          storeId: validation.allocatedStore!.storeId,
          status: "ORDER_PLACED",
          subtotal: validation.subtotal,
          deliveryFee: validation.deliveryFee,
          discount: validation.discount,
          total: validation.total,
          notes: input.notes ? input.notes.trim() : null,
        },
      });

      // Create Immutable Address Snapshot (OrderAddress)
      await tx.orderAddress.create({
        data: {
          orderId: order.id,
          fullName: addressData.fullName,
          phone: addressData.phone,
          addressLine1: addressData.addressLine1,
          addressLine2: addressData.addressLine2,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode,
        },
      });

      // Create Order Items with frozen product & variant details
      for (const item of validation.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { sku: true },
        });

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            productName: item.productName,
            variantSku: variant?.sku || "SKU-UNKNOWN",
            sizeName: item.sizeName,
            colorName: item.colorName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          },
        });
      }

      // Create Payment record with status PENDING
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: validation.total,
          currency: "INR",
          status: "PENDING",
          gateway: "RAZORPAY",
        },
      });

      // Clear Cart
      const cart = await tx.cart.findFirst({
        where: userId ? { userId } : { sessionToken: sessionToken || "" },
      });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return order;
    });

    const fullOrder = await getOrderByIdOrNumber(
      orderRecord.id,
      userId ? { id: userId, role: "CUSTOMER" } : null,
      guestToken
    );
    if (!fullOrder) {
      throw new AppError("Order created but failed to load summary.", "INTERNAL_SERVER_ERROR", 500);
    }

    return fullOrder;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error creating order:", error);
    throw new AppError("Failed to create order.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function getUserOrders(userId: string): Promise<OrderDTO[]> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        store: true,
        address: true,
        items: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) => mapOrderToDTO(o));
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw new AppError("Failed to fetch order history.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function getOrderByIdOrNumber(
  idOrOrderNumber: string,
  sessionUser?: { id: string; role: string } | null,
  guestToken?: string | null
): Promise<OrderDTO | null> {
  try {
    const isCuid = idOrOrderNumber.startsWith("c") && idOrOrderNumber.length > 20;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(isCuid ? [{ id: idOrOrderNumber }] : []),
          { orderNumber: idOrOrderNumber },
        ],
      },
      include: {
        store: true,
        address: true,
        items: true,
        payment: true,
      },
    });

    if (!order) return null;

    // Strict IDOR Authorization Enforcement
    if (order.userId !== null) {
      // Authenticated Order: Only owning user or ADMIN may access
      if (!sessionUser || (sessionUser.id !== order.userId && sessionUser.role !== "ADMIN")) {
        throw new AppError("Access denied. You do not own this order.", "FORBIDDEN", 403);
      }
    } else {
      // Guest Order: Require matching guestToken or ADMIN
      if (sessionUser && sessionUser.role === "ADMIN") {
        // Admin permitted
      } else if (!guestToken || order.guestToken !== guestToken) {
        throw new AppError("Access denied. Valid guest order token required.", "FORBIDDEN", 403);
      }
    }

    return mapOrderToDTO(order);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error fetching order:", error);
    throw new AppError("Failed to fetch order details.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

function mapOrderToDTO(order: any): OrderDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    guestToken: order.guestToken || null,
    userId: order.userId,
    guestEmail: order.guestEmail,
    storeId: order.storeId,
    fulfillmentStore: order.store
      ? {
          id: order.store.id,
          name: order.store.name,
          city: order.store.city,
          address: order.store.address,
        }
      : null,
    status: order.status,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discount: Number(order.discount),
    total: Number(order.total),
    itemCount: order.items.length,
    items: order.items.map((i: any) => ({
      id: i.id,
      variantId: i.variantId,
      productName: i.productName,
      variantSku: i.variantSku,
      sizeName: i.sizeName,
      colorName: i.colorName,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
      subtotal: Number(i.subtotal),
    })),
    address: order.address
      ? {
          id: order.address.id,
          fullName: order.address.fullName,
          addressLine1: order.address.addressLine1,
          addressLine2: order.address.addressLine2,
          city: order.address.city,
          state: order.address.state,
          pincode: order.address.pincode,
          phone: order.address.phone,
        }
      : null,
    paymentStatus: (order.payment?.status || "PENDING") as PaymentStatusType,
    paymentDetails: order.payment
      ? {
          gateway: order.payment.gateway,
          razorpayOrderId: order.payment.razorpayOrderId,
          razorpayPaymentId: order.payment.razorpayPaymentId,
          verifiedAt: order.payment.verifiedAt?.toISOString() || null,
        }
      : null,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
