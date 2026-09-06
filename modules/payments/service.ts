import crypto from "crypto";
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

    // Target EXACT fulfillment store inventory with CONDITIONAL ATOMIC UPDATE
    const order = payment.order;
    if (!order.storeId) {
      throw new AppError("Order has no assigned fulfillment store.", "INTERNAL_SERVER_ERROR", 500);
    }

    let allItemsCommitted = true;
    for (const item of order.items) {
      const invUpdate = await tx.inventory.updateMany({
        where: {
          storeId: order.storeId,
          variantId: item.variantId,
          quantity: { gte: item.quantity },
        },
        data: {
          quantity: { decrement: item.quantity },
        },
      });

      if (invUpdate.count === 0) {
        allItemsCommitted = false;
        break;
      }
    }

    if (allItemsCommitted) {
      // Normal winning path: Confirm Order
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" },
      });
    } else {
      // Safe Recovery State: Stock was exhausted by concurrent order
      // Invariants:
      // 1. Payment accurately recorded as PAID (money was genuinely captured)
      // 2. Physical inventory NEVER drops below 0
      // 3. Order is put into explicit fulfillment exception state
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PROCESSING",
          notes: "FULFILLMENT_EXCEPTION: Store stock depleted during concurrent checkout. Administrator manual reallocation or refund required.",
        },
      });

      // Record Audit Log for administrator intervention
      await tx.auditLog.create({
        data: {
          userId: order.userId || null,
          action: "ORDER_FULFILLMENT_EXCEPTION_STOCK_DEPLETED",
          entityType: "Order",
          entityId: order.id,
          details: {
            orderNumber: order.orderNumber,
            allocatedStoreId: order.storeId,
            reason: "Store stock exhausted before payment confirmation. Reallocation or refund required.",
          },
        },
      });
    }

    return {
      alreadyPaid: false,
      orderId: order.id,
      orderNumber: order.orderNumber,
      stockExhausted: !allItemsCommitted,
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

    // Atomic Database Transaction: Update Payment, Order Status, and AuditLog
    const txResult = await prisma.$transaction(async (tx) => {
      // Conditional atomic update
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
        return { alreadyProcessed: true };
      }

      // Order status transition: Only transition if in initial placement/processing
      if (paymentRecord!.order.status === "ORDER_PLACED" || paymentRecord!.order.status === "PROCESSING") {
        await tx.order.update({
          where: { id: paymentRecord!.orderId },
          data: { status: "CONFIRMED" },
        });
      }

      // Record immutable audit event
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
