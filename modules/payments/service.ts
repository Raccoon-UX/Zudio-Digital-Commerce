import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { razorpay } from "./razorpay";
import {
  RazorpayOrderResponseDTO,
  VerifyPaymentInput,
  PaymentVerificationResultDTO,
  WebhookProcessingResult,
} from "./types";

export async function createRazorpayPaymentOrder(
  orderId: string,
  userId?: string | null
): Promise<RazorpayOrderResponseDTO> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      payment: true,
      store: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found.", "INVALID_REQUEST", 404);
  }

  // Authorization check
  if (order.userId && userId && order.userId !== userId) {
    throw new AppError("Access denied to this order.", "FORBIDDEN", 403);
  }

  if (order.payment?.status === "PAID") {
    throw new AppError("This order has already been paid and confirmed.", "INVALID_REQUEST", 400);
  }

  if (!order.storeId) {
    throw new AppError("Order has no allocated fulfillment store.", "INVALID_REQUEST", 400);
  }

  const amountInPaise = Math.round(Number(order.total) * 100);
  const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";

  let razorpayOrderId: string;

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
      },
    });

    razorpayOrderId = razorpayOrder.id;
  } catch (error: any) {
    console.error("Razorpay API order creation failed:", error);
    // If running in development with placeholder credentials, generate a deterministic test order ID
    if (process.env.NODE_ENV !== "production" && keyId.includes("placeholder")) {
      razorpayOrderId = `order_test_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    } else {
      throw new AppError(
        "Failed to initialize payment with gateway. Please check payment credentials.",
        "PAYMENT_FAILED",
        500,
        error
      );
    }
  }

  // Update Payment record state to PROCESSING
  await prisma.payment.update({
    where: { orderId: order.id },
    data: {
      razorpayOrderId,
      status: "PROCESSING",
    },
  });

  return {
    razorpayOrderId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: amountInPaise,
    currency: "INR",
    keyId,
    customer: {
      name: order.address?.fullName || "Valued Customer",
      email: order.guestEmail || "customer@zudiopilot.com",
      phone: order.address?.phone || "",
    },
  };
}

export interface CommitInventoryOptions {
  eventSource?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
}

export interface InventoryItemCommitDetail {
  variantId: string;
  variantSku: string;
  productName: string;
  quantityRequested: number;
  quantityBefore: number;
  quantityAfter: number;
  reservedQuantity: number;
  availableBefore: number;
  availableAfter: number;
}

export interface FailedFulfillmentItem {
  variantId: string;
  variantSku: string;
  productName: string;
  quantityRequested: number;
  quantityAvailable: number;
  physicalQuantity: number;
  reservedQuantity: number;
  reason: string;
}

export interface OrderFulfillmentResult {
  stockCommitted: boolean;
  orderId: string;
  orderNumber: string;
  storeId: string;
  itemDetails: InventoryItemCommitDetail[];
  failedItems?: FailedFulfillmentItem[];
}

/**
 * Shared Internal Transactional All-or-Nothing Fulfillment Routine.
 *
 * Invariants:
 * 1. Evaluates available stock strictly as (quantity - reservedQuantity).
 *    Never consumes stock held by active in-store reservations.
 * 2. Uses PostgreSQL row-level locks (FOR UPDATE) in deterministic ascending order
 *    to guarantee race-free concurrency and prevent deadlocks.
 * 3. ALL-OR-NOTHING: If ANY line item lacks available stock, ZERO inventory rows are decremented.
 *    Order transitions to PROCESSING with FULFILLMENT_EXCEPTION note and audit log.
 * 4. SUCCESS: Decrements exact physical stock for all items, transitions Order to CONFIRMED,
 *    and writes rich INVENTORY_FULFILLMENT_COMMITTED audit log.
 */
export async function commitOrderInventory(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    orderNumber: string;
    userId?: string | null;
    storeId?: string | null;
    items: Array<{
      variantId: string;
      variantSku?: string;
      productName?: string;
      quantity: number;
    }>;
  },
  options?: CommitInventoryOptions
): Promise<OrderFulfillmentResult> {
  if (!order.storeId) {
    throw new AppError("Order has no assigned fulfillment store.", "INTERNAL_SERVER_ERROR", 500);
  }

  const storeId = order.storeId;
  const uniqueVariantIds = Array.from(new Set(order.items.map((i) => i.variantId)));

  if (uniqueVariantIds.length === 0) {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    });
    return {
      stockCommitted: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      storeId,
      itemDetails: [],
    };
  }

  // 1. Acquire PostgreSQL Exclusive Row-Level Locks (FOR UPDATE) in deterministic order
  let lockedInventories: Array<{
    id: string;
    storeId: string;
    variantId: string;
    quantity: number;
    reservedQuantity: number;
  }>;

  try {
    lockedInventories = await tx.$queryRaw<
      Array<{
        id: string;
        storeId: string;
        variantId: string;
        quantity: number;
        reservedQuantity: number;
      }>
    >(
      Prisma.sql`SELECT "id", "storeId", "variantId", "quantity", "reservedQuantity"
                 FROM "Inventory"
                 WHERE "storeId" = ${storeId}
                   AND "variantId" IN (${Prisma.join(uniqueVariantIds)})
                 ORDER BY "variantId" ASC
                 FOR UPDATE`
    );
  } catch {
    // Graceful fallback for non-Postgres adapters or simulated environments
    lockedInventories = await tx.inventory.findMany({
      where: {
        storeId,
        variantId: { in: uniqueVariantIds },
      },
      orderBy: { variantId: "asc" },
    });
  }

  const invMap = new Map(lockedInventories.map((i) => [i.variantId, i]));

  // Aggregate total requested quantity per variant across all line items
  const requestedMap = new Map<string, number>();
  for (const item of order.items) {
    requestedMap.set(
      item.variantId,
      (requestedMap.get(item.variantId) || 0) + item.quantity
    );
  }

  // 2. Validate All-or-Nothing Availability against (quantity - reservedQuantity)
  const failedItems: FailedFulfillmentItem[] = [];

  for (const [variantId, totalRequested] of Array.from(requestedMap.entries())) {
    const inv = invMap.get(variantId);
    const matchingItem = order.items.find((i) => i.variantId === variantId);

    if (!inv) {
      failedItems.push({
        variantId,
        variantSku: matchingItem?.variantSku || "UNKNOWN",
        productName: matchingItem?.productName || "Product",
        quantityRequested: totalRequested,
        quantityAvailable: 0,
        physicalQuantity: 0,
        reservedQuantity: 0,
        reason: "Inventory record does not exist at allocated fulfillment store.",
      });
      continue;
    }

    const availableStock = Math.max(0, inv.quantity - inv.reservedQuantity);
    if (availableStock < totalRequested) {
      failedItems.push({
        variantId,
        variantSku: matchingItem?.variantSku || "UNKNOWN",
        productName: matchingItem?.productName || "Product",
        quantityRequested: totalRequested,
        quantityAvailable: availableStock,
        physicalQuantity: inv.quantity,
        reservedQuantity: inv.reservedQuantity,
        reason: `Insufficient available stock (requested ${totalRequested}, available ${availableStock}, physical ${inv.quantity}, reserved ${inv.reservedQuantity}).`,
      });
    }
  }

  // 3. Winning Path: All items have sufficient stock
  if (failedItems.length === 0) {
    const itemDetails: InventoryItemCommitDetail[] = [];

    for (const [variantId, totalRequested] of Array.from(requestedMap.entries())) {
      const inv = invMap.get(variantId)!;
      const matchingItem = order.items.find((i) => i.variantId === variantId);

      await tx.inventory.update({
        where: {
          storeId_variantId: {
            storeId,
            variantId,
          },
        },
        data: {
          quantity: { decrement: totalRequested },
        },
      });

      itemDetails.push({
        variantId,
        variantSku: matchingItem?.variantSku || "UNKNOWN",
        productName: matchingItem?.productName || "Product",
        quantityRequested: totalRequested,
        quantityBefore: inv.quantity,
        quantityAfter: inv.quantity - totalRequested,
        reservedQuantity: inv.reservedQuantity,
        availableBefore: Math.max(0, inv.quantity - inv.reservedQuantity),
        availableAfter: Math.max(0, inv.quantity - totalRequested - inv.reservedQuantity),
      });
    }

    // Move order to CONFIRMED
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    });

    // Record comprehensive fulfillment audit event
    await tx.auditLog.create({
      data: {
        userId: order.userId || null,
        action: "INVENTORY_FULFILLMENT_COMMITTED",
        entityType: "Order",
        entityId: order.id,
        details: {
          orderNumber: order.orderNumber,
          allocatedStoreId: storeId,
          eventSource: options?.eventSource || "PAYMENT_CAPTURE",
          razorpayOrderId: options?.razorpayOrderId,
          razorpayPaymentId: options?.razorpayPaymentId,
          paymentMethod: options?.paymentMethod,
          status: "CONFIRMED",
          items: itemDetails,
        } as any,
      },
    });

    return {
      stockCommitted: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      storeId,
      itemDetails,
    };
  }

  // 4. Safe Recovery Path: Zero partial decrements (ALL-OR-NOTHING)
  await tx.order.update({
    where: { id: order.id },
    data: {
      status: "PROCESSING",
      notes: "FULFILLMENT_EXCEPTION: Store stock depleted during concurrent checkout. Administrator manual reallocation or refund required.",
    },
  });

  await tx.auditLog.create({
    data: {
      userId: order.userId || null,
      action: "ORDER_FULFILLMENT_EXCEPTION_STOCK_DEPLETED",
      entityType: "Order",
      entityId: order.id,
      details: {
        orderNumber: order.orderNumber,
        allocatedStoreId: storeId,
        eventSource: options?.eventSource || "PAYMENT_CAPTURE",
        razorpayOrderId: options?.razorpayOrderId,
        razorpayPaymentId: options?.razorpayPaymentId,
        reason: "Store stock exhausted or held by active reservations before payment confirmation. Reallocation or refund required.",
        failedItems,
      } as any,
    },
  });

  return {
    stockCommitted: false,
    orderId: order.id,
    orderNumber: order.orderNumber,
    storeId,
    itemDetails: [],
    failedItems,
  };
}

/**
 * Strict Cryptographic Server-Side Payment Verification.
 * ONLY accepts genuinely verifiable Razorpay payment credentials and HMAC-SHA256 signatures.
 * Zero client bypasses or hardcoded test signatures allowed.
 */
export async function verifyPaymentSignature(
  input: VerifyPaymentInput
): Promise<PaymentVerificationResultDTO> {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = input;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError("Missing required payment verification parameters.", "INVALID_REQUEST", 400);
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new AppError("Payment gateway secret configuration is missing.", "INTERNAL_SERVER_ERROR", 500);
  }

  // 1. Strict Cryptographic HMAC SHA-256 verification (Zero Bypass)
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const isSignatureValid = expectedSignature === razorpaySignature;

  if (!isSignatureValid) {
    await prisma.payment.updateMany({
      where: { orderId, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "FAILED" },
    });

    throw new AppError(
      "Payment verification failed: Invalid cryptographic signature.",
      "PAYMENT_VERIFICATION_FAILED",
      400
    );
  }

  // 2. Atomic Database-level conditional transition and exact inventory commitment
  const verificationResult = await prisma.$transaction(async (tx) => {
    // Check current payment status
    const payment = await tx.payment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: { items: true, store: true },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment record not found.", "INVALID_REQUEST", 404);
    }

    // Idempotency: If already paid, return confirmed state without double-decrementing inventory
    if (payment.status === "PAID") {
      return {
        alreadyPaid: true,
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        verifiedAt: payment.verifiedAt ? payment.verifiedAt.toISOString() : new Date().toISOString(),
        razorpayPaymentId: payment.razorpayPaymentId || razorpayPaymentId,
      };
    }

    // Conditional atomic transition (only update if still PENDING/PROCESSING)
    const updateCount = await tx.payment.updateMany({
      where: {
        orderId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: {
        status: "PAID",
        razorpayPaymentId,
        razorpaySignature,
        paymentMethod: paymentMethod || "RAZORPAY",
        verifiedAt: new Date(),
      },
    });

    if (updateCount.count === 0) {
      // Lost race to concurrent webhook/verification call; payment already transitioned
      return {
        alreadyPaid: true,
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        verifiedAt: new Date().toISOString(),
        razorpayPaymentId,
      };
    }

    // Commit inventory using shared transactional routine
    const fulfillment = await commitOrderInventory(tx, payment.order, {
      eventSource: "CLIENT_VERIFICATION",
      razorpayOrderId,
      razorpayPaymentId,
      paymentMethod: paymentMethod || "RAZORPAY",
    });

    return {
      alreadyPaid: false,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      stockExhausted: !fulfillment.stockCommitted,
      verifiedAt: new Date().toISOString(),
      razorpayPaymentId,
    };
  });

  return {
    success: true,
    orderId: verificationResult.orderId,
    orderNumber: verificationResult.orderNumber,
    status: "PAID",
    verifiedAt: verificationResult.verifiedAt,
    razorpayPaymentId: verificationResult.razorpayPaymentId,
  };
}

/**
 * Strict Cryptographic Webhook HMAC-SHA256 Signature Verification.
 * Uses timingSafeEqual to protect against timing analysis attacks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const actualBuf = Buffer.from(signatureHeader, "utf8");

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Handle Razorpay Webhook Events with strict cryptographic verification and atomic state transitions.
 * Authoritative server-side event processor.
 * Idempotent, safe against duplicate deliveries, and logs structured audit events.
 * (Phase A1: Updates Payment and Order state without inventory deduction).
 */
export async function handleRazorpayWebhook(
  rawBody: string,
  signatureHeader: string | null
): Promise<WebhookProcessingResult> {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new AppError("Razorpay webhook secret configuration is missing on server.", "INTERNAL_SERVER_ERROR", 500);
  }

  if (!signatureHeader) {
    throw new AppError("Missing Razorpay webhook signature header.", "INVALID_REQUEST", 400);
  }

  const isSignatureValid = verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
  if (!isSignatureValid) {
    throw new AppError("Invalid Razorpay webhook cryptographic signature.", "INVALID_REQUEST", 400);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new AppError("Malformed JSON payload in webhook body.", "INVALID_REQUEST", 400);
  }

  const event = payload?.event;
  if (!event || typeof event !== "string") {
    throw new AppError("Missing or invalid event field in webhook payload.", "INVALID_REQUEST", 400);
  }

  // 1. Successful payment events: payment.captured or order.paid
  if (event === "payment.captured" || event === "order.paid") {
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;
    const paymentMethod = paymentEntity?.method || "RAZORPAY_WEBHOOK";

    if (!razorpayOrderId) {
      return {
        received: true,
        event,
        status: "ignored",
        message: "No associated Razorpay order ID found in payload.",
      };
    }

    // Lookup payment record by razorpayOrderId or fallback to notes.orderId
    let paymentRecord = await prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { order: true },
    });

    if (!paymentRecord) {
      const noteOrderId = paymentEntity?.notes?.orderId || orderEntity?.notes?.orderId;
      if (noteOrderId) {
        paymentRecord = await prisma.payment.findUnique({
          where: { orderId: noteOrderId },
          include: { order: true },
        });
      }
    }

    if (!paymentRecord) {
      return {
        received: true,
        event,
        status: "ignored",
        message: `No matching internal order found for Razorpay Order ${razorpayOrderId}.`,
      };
    }

    // Idempotency check: Already marked PAID
    if (paymentRecord.status === "PAID") {
      return {
        received: true,
        event,
        orderId: paymentRecord.orderId,
        orderNumber: paymentRecord.order.orderNumber,
        paymentId: paymentRecord.razorpayPaymentId || razorpayPaymentId,
        status: "already_processed",
        message: "Payment and order are already marked as PAID.",
      };
    }

    // Atomic Database Transaction: Update Payment, Order Status, and AuditLog with All-or-Nothing Inventory Commitment
    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Conditional atomic update (Single-Winner Gate)
      const updateResult = await tx.payment.updateMany({
        where: {
          orderId: paymentRecord!.orderId,
          status: { in: ["PENDING", "PROCESSING", "FAILED"] },
        },
        data: {
          status: "PAID",
          razorpayOrderId,
          razorpayPaymentId: razorpayPaymentId || undefined,
          paymentMethod,
          verifiedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        // Lost race to concurrent webhook / callback; already updated to PAID
        return { alreadyProcessed: true, stockCommitted: false };
      }

      // 2. Fetch full order with items and store
      const orderWithItems = await tx.order.findUnique({
        where: { id: paymentRecord!.orderId },
        include: { items: true, store: true },
      });

      if (!orderWithItems) {
        throw new AppError("Associated order not found.", "INTERNAL_SERVER_ERROR", 500);
      }

      // 3. Commit inventory atomically via shared routine
      const fulfillment = await commitOrderInventory(tx, orderWithItems, {
        eventSource: "WEBHOOK",
        razorpayOrderId,
        razorpayPaymentId,
        paymentMethod,
      });

      // 4. Record webhook audit event
      await tx.auditLog.create({
        data: {
          userId: paymentRecord!.order.userId || null,
          action: "PAYMENT_WEBHOOK_PROCESSED",
          entityType: "Order",
          entityId: paymentRecord!.orderId,
          details: {
            orderNumber: paymentRecord!.order.orderNumber,
            razorpayOrderId,
            razorpayPaymentId,
            paymentMethod,
            event,
            amount: paymentEntity?.amount ? paymentEntity.amount / 100 : Number(paymentRecord!.amount),
            previousStatus: paymentRecord!.status,
            newStatus: "PAID",
            orderStatus: fulfillment.stockCommitted ? "CONFIRMED" : "PROCESSING",
            stockCommitted: fulfillment.stockCommitted,
            allocatedStoreId: orderWithItems.storeId,
          },
        },
      });

      return { alreadyProcessed: false, stockCommitted: fulfillment.stockCommitted };
    });

    return {
      received: true,
      event,
      orderId: paymentRecord.orderId,
      orderNumber: paymentRecord.order.orderNumber,
      paymentId: razorpayPaymentId || paymentRecord.razorpayPaymentId,
      status: txResult.alreadyProcessed ? "already_processed" : "processed",
      message: txResult.alreadyProcessed
        ? "Payment was already updated concurrently."
        : "Payment and Order status successfully confirmed as PAID.",
    };
  }

  // 2. Failed payment event: payment.failed
  if (event === "payment.failed") {
    const paymentEntity = payload.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;
    const errorCode = paymentEntity?.error_code || "PAYMENT_FAILED";
    const errorDescription = paymentEntity?.error_description || "Payment failed at gateway";

    if (!razorpayOrderId) {
      return {
        received: true,
        event,
        status: "ignored",
        message: "No associated Razorpay order ID found in payment.failed payload.",
      };
    }

    const paymentRecord = await prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { order: true },
    });

    if (!paymentRecord) {
      return {
        received: true,
        event,
        status: "ignored",
        message: `No matching internal order found for Razorpay Order ${razorpayOrderId}.`,
      };
    }

    // Idempotency: If already marked PAID, do not revert to FAILED
    if (paymentRecord.status === "PAID") {
      return {
        received: true,
        event,
        orderId: paymentRecord.orderId,
        orderNumber: paymentRecord.order.orderNumber,
        paymentId: paymentRecord.razorpayPaymentId || razorpayPaymentId,
        status: "already_processed",
        message: "Order is already in PAID state; ignored late failure event.",
      };
    }

    // Idempotency: If already marked FAILED
    if (paymentRecord.status === "FAILED") {
      return {
        received: true,
        event,
        orderId: paymentRecord.orderId,
        orderNumber: paymentRecord.order.orderNumber,
        paymentId: paymentRecord.razorpayPaymentId || razorpayPaymentId,
        status: "already_processed",
        message: "Payment failure has already been recorded.",
      };
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.payment.updateMany({
        where: {
          orderId: paymentRecord.orderId,
          status: { in: ["PENDING", "PROCESSING"] },
        },
        data: {
          status: "FAILED",
          razorpayPaymentId: razorpayPaymentId || undefined,
        },
      });

      if (updateResult.count === 0) {
        return { alreadyProcessed: true };
      }

      await tx.auditLog.create({
        data: {
          userId: paymentRecord.order.userId || null,
          action: "PAYMENT_WEBHOOK_FAILED",
          entityType: "Order",
          entityId: paymentRecord.orderId,
          details: {
            orderNumber: paymentRecord.order.orderNumber,
            razorpayOrderId,
            razorpayPaymentId,
            errorCode,
            errorDescription,
            event,
          },
        },
      });

      return { alreadyProcessed: false };
    });

    return {
      received: true,
      event,
      orderId: paymentRecord.orderId,
      orderNumber: paymentRecord.order.orderNumber,
      paymentId: razorpayPaymentId,
      status: txResult.alreadyProcessed ? "already_processed" : "failed_recorded",
      message: txResult.alreadyProcessed
        ? "Payment failure was already recorded."
        : `Payment failure recorded: ${errorDescription}`,
    };
  }

  // 3. Other unhandled Razorpay events
  return {
    received: true,
    event,
    status: "ignored",
    message: `Event '${event}' safely acknowledged.`,
  };
}

/**
 * Server-Side Isolated Test Simulation for automated integration test suites ONLY.
 * Disabled by default. Strictly fails closed if ALLOW_DEV_PAYMENT_SIMULATION !== "true" or NODE_ENV === "production".
 * Signs the payload with the server's own secret before passing into the strict verifyPaymentSignature pipeline.
 */
export async function simulateDevPaymentForTesting(orderId: string): Promise<PaymentVerificationResultDTO> {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEV_PAYMENT_SIMULATION !== "true") {
    throw new AppError("Development payment simulation is disabled.", "FORBIDDEN", 403);
  }

  const payment = await prisma.payment.findUnique({
    where: { orderId },
  });

  if (!payment || !payment.razorpayOrderId) {
    throw new AppError("Payment order must be initialized before test simulation.", "INVALID_REQUEST", 400);
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || "razorpay_secret_placeholder";
  const simPaymentId = `pay_devsim_${Date.now()}`;
  const validSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${payment.razorpayOrderId}|${simPaymentId}`)
    .digest("hex");

  return verifyPaymentSignature({
    orderId,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: simPaymentId,
    razorpaySignature: validSignature,
    paymentMethod: "DEV_SIMULATION",
  });
}
