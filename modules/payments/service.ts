import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { razorpay } from "./razorpay";
import {
  RazorpayOrderResponseDTO,
  VerifyPaymentInput,
  PaymentVerificationResultDTO,
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
 * Handle Razorpay Webhook Events with strict cryptographic verification against RAZORPAY_WEBHOOK_SECRET.
 */
export async function handleRazorpayWebhook(
  rawBody: string,
  signatureHeader: string | null
): Promise<{ processed: boolean; event?: string }> {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signatureHeader || !webhookSecret) {
    throw new AppError("Missing Razorpay webhook signature header or server secret.", "UNAUTHORIZED", 401);
  }

  // Validate webhook signature strictly
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signatureHeader) {
    throw new AppError("Invalid webhook signature.", "UNAUTHORIZED", 401);
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event;

  if (event === "payment.captured" || event === "order.paid") {
    const paymentEntity = payload.payload.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id || payload.payload.order?.entity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (razorpayOrderId) {
      const paymentRecord = await prisma.payment.findUnique({
        where: { razorpayOrderId },
      });

      if (paymentRecord && paymentRecord.status !== "PAID") {
        const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
        const genuineSignature = crypto
          .createHmac("sha256", keySecret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest("hex");

        await verifyPaymentSignature({
          orderId: paymentRecord.orderId,
          razorpayOrderId,
          razorpayPaymentId: razorpayPaymentId || `pay_webhook_${Date.now()}`,
          razorpaySignature: genuineSignature,
          paymentMethod: paymentEntity?.method || "WEBHOOK",
        });
      }
    }
  }

  return { processed: true, event };
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
