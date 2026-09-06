import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  handleRazorpayWebhook,
  verifyWebhookSignature,
} from "../modules/payments/service";
import { AppError } from "../lib/errors";

const prisma = new PrismaClient();

async function runPhaseA1Tests() {
  console.log("==================================================");
  console.log(" RUNNING PHASE A1: RAZORPAY WEBHOOK AUTOMATION TESTS");
  console.log("==================================================\n");

  const testSecret = "whsec_phase_a1_test_secret_123456";
  process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

  // ----------------------------------------------------
  // TEST 1: Direct Signature Verification Helper
  // ----------------------------------------------------
  console.log("[TEST 1] Testing verifyWebhookSignature Helper...");
  const samplePayload = JSON.stringify({
    event: "payment.captured",
    created_at: Math.floor(Date.now() / 1000),
  });

  const validSig = crypto
    .createHmac("sha256", testSecret)
    .update(samplePayload)
    .digest("hex");

  const isSigValid = verifyWebhookSignature(samplePayload, validSig, testSecret);
  console.log(`✓ Valid Signature Recognized: ${isSigValid}`);
  if (!isSigValid) throw new Error("Expected valid signature to be true.");

  // ----------------------------------------------------
  // TEST 2: Invalid Signature Rejection
  // ----------------------------------------------------
  console.log("\n[TEST 2] Testing Invalid Signature Rejection...");
  const isInvalidSigValid = verifyWebhookSignature(samplePayload, "invalid_sig_hex_123", testSecret);
  console.log(`✓ Invalid Signature Rejected: ${!isInvalidSigValid}`);
  if (isInvalidSigValid) throw new Error("Invalid signature was incorrectly accepted.");

  // ----------------------------------------------------
  // TEST 3: Tampered Payload Rejection
  // ----------------------------------------------------
  console.log("\n[TEST 3] Testing Tampered Payload Rejection...");
  const tamperedPayload = samplePayload + " ";
  const isTamperedSigValid = verifyWebhookSignature(tamperedPayload, validSig, testSecret);
  console.log(`✓ Tampered Payload Rejected: ${!isTamperedSigValid}`);
  if (isTamperedSigValid) throw new Error("Tampered payload signature was incorrectly accepted.");

  // ----------------------------------------------------
  // TEST 4: Missing Signature Header in handleRazorpayWebhook
  // ----------------------------------------------------
  console.log("\n[TEST 4] Testing Missing Signature Header in handleRazorpayWebhook...");
  try {
    await handleRazorpayWebhook(samplePayload, null);
    throw new Error("Expected missing signature header to throw AppError");
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 400) {
      console.log(`✓ Missing signature correctly rejected with HTTP 400 (${err.message})`);
    } else {
      throw err;
    }
  }

  // ----------------------------------------------------
  // TEST 5: Missing Server Secret in handleRazorpayWebhook
  // ----------------------------------------------------
  console.log("\n[TEST 5] Testing Missing Server Secret in handleRazorpayWebhook...");
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  try {
    await handleRazorpayWebhook(samplePayload, validSig);
    throw new Error("Expected missing server secret to throw AppError");
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 500) {
      console.log(`✓ Missing server secret correctly rejected with HTTP 500 (${err.message})`);
    } else {
      throw err;
    }
  }
  process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

  // ----------------------------------------------------
  // TEST 6: Malformed JSON Payload
  // ----------------------------------------------------
  console.log("\n[TEST 6] Testing Malformed JSON Payload...");
  const malformedPayload = "{ not valid json ";
  const malformedSig = crypto.createHmac("sha256", testSecret).update(malformedPayload).digest("hex");
  try {
    await handleRazorpayWebhook(malformedPayload, malformedSig);
    throw new Error("Expected malformed JSON to throw AppError");
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 400) {
      console.log(`✓ Malformed JSON correctly rejected with HTTP 400 (${err.message})`);
    } else {
      throw err;
    }
  }

  // ----------------------------------------------------
  // TEST 7: Safely Acknowledged Unhandled Event
  // ----------------------------------------------------
  console.log("\n[TEST 7] Testing Safely Acknowledged Unhandled Event...");
  const unhandledPayload = JSON.stringify({
    event: "settlement.processed",
    payload: { settlement: { id: "set_123" } },
  });
  const unhandledSig = crypto.createHmac("sha256", testSecret).update(unhandledPayload).digest("hex");
  const unhandledResult = await handleRazorpayWebhook(unhandledPayload, unhandledSig);
  console.log(`✓ Unhandled Event Result: status=${unhandledResult.status}, received=${unhandledResult.received}`);
  if (unhandledResult.status !== "ignored" || !unhandledResult.received) {
    throw new Error("Unhandled event was not acknowledged with status: 'ignored'");
  }

  // ----------------------------------------------------
  // TEST 8: Live / Database Order Webhook Integration Test
  // ----------------------------------------------------
  console.log("\n[TEST 8] Testing payment.captured Webhook Event with Database Order...");
  let testOrderId: string | null = null;
  const mockRzpOrderId = `order_webhook_test_${Date.now()}`;
  const mockRzpPaymentId = `pay_webhook_test_${Date.now()}`;

  try {
    // Check if DB is accessible
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: `TEST-WH-${Date.now().toString(36).toUpperCase()}`,
        status: "ORDER_PLACED",
        subtotal: 999.0,
        total: 999.0,
        guestEmail: "webhook-test@zudiopilot.com",
        payment: {
          create: {
            amount: 999.0,
            currency: "INR",
            status: "PENDING",
            razorpayOrderId: mockRzpOrderId,
          },
        },
      },
      include: { payment: true },
    });
    testOrderId = testOrder.id;
    console.log(`  Created test order: #${testOrder.orderNumber} (ID: ${testOrder.id})`);

    // Construct valid payment.captured webhook payload
    const paymentCapturedPayload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: mockRzpPaymentId,
            order_id: mockRzpOrderId,
            amount: 99900,
            currency: "INR",
            status: "captured",
            method: "upi",
          },
        },
      },
    });

    const paymentCapturedSig = crypto
      .createHmac("sha256", testSecret)
      .update(paymentCapturedPayload)
      .digest("hex");

    const captureResult = await handleRazorpayWebhook(paymentCapturedPayload, paymentCapturedSig);
    console.log(`✓ Webhook Processed: status=${captureResult.status}, paymentId=${captureResult.paymentId}`);
    if (captureResult.status !== "processed") {
      throw new Error(`Expected captureResult status 'processed', got '${captureResult.status}'`);
    }

    // Verify DB State
    const orderAfter = await prisma.order.findUnique({
      where: { id: testOrderId },
      include: { payment: true },
    });

    console.log(`✓ Order Status Updated: ${orderAfter?.status} (Expected: CONFIRMED)`);
    console.log(`✓ Payment Status Updated: ${orderAfter?.payment?.status} (Expected: PAID)`);
    console.log(`✓ Payment Razorpay ID: ${orderAfter?.payment?.razorpayPaymentId} (Expected: ${mockRzpPaymentId})`);

    if (orderAfter?.status !== "CONFIRMED" || orderAfter?.payment?.status !== "PAID") {
      throw new Error("Database state did not update to CONFIRMED / PAID.");
    }

    // Verify Audit Log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entityId: testOrderId,
        action: "PAYMENT_WEBHOOK_PROCESSED",
      },
    });
    console.log(`✓ Audit Log Recorded: action=${auditLog?.action}, entityId=${auditLog?.entityId}`);
    if (!auditLog) {
      throw new Error("Audit log record was not created in the database transaction!");
    }

    // ----------------------------------------------------
    // TEST 9: Duplicate Webhook Idempotency Test
    // ----------------------------------------------------
    console.log("\n[TEST 9] Testing Duplicate Webhook Delivery Idempotency...");
    const duplicateResult = await handleRazorpayWebhook(paymentCapturedPayload, paymentCapturedSig);
    console.log(`✓ Duplicate Webhook Result: status=${duplicateResult.status}`);
    if (duplicateResult.status !== "already_processed") {
      throw new Error(`Expected duplicate webhook status 'already_processed', got '${duplicateResult.status}'`);
    }

    // Count audit logs to ensure no duplicate entries
    const auditCount = await prisma.auditLog.count({
      where: {
        entityId: testOrderId,
        action: "PAYMENT_WEBHOOK_PROCESSED",
      },
    });
    console.log(`✓ Total Audit Logs for Order: ${auditCount} (Expected: 1)`);
    if (auditCount !== 1) {
      throw new Error("Duplicate webhook generated duplicate audit log entries!");
    }

    // ----------------------------------------------------
    // TEST 10: Late payment.failed Event on Already PAID Order
    // ----------------------------------------------------
    console.log("\n[TEST 10] Testing Late payment.failed Event on Already PAID Order...");
    const paymentFailedPayload = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: `pay_failed_${Date.now()}`,
            order_id: mockRzpOrderId,
            error_code: "BAD_REQUEST_ERROR",
            error_description: "Card expired",
          },
        },
      },
    });
    const paymentFailedSig = crypto
      .createHmac("sha256", testSecret)
      .update(paymentFailedPayload)
      .digest("hex");

    const failedResult = await handleRazorpayWebhook(paymentFailedPayload, paymentFailedSig);
    console.log(`✓ Late Failure Result: status=${failedResult.status}`);
    if (failedResult.status !== "already_processed") {
      throw new Error("Late failure event was not recognized as already processed.");
    }

    const orderFinal = await prisma.order.findUnique({
      where: { id: testOrderId },
      include: { payment: true },
    });
    console.log(`✓ Order Final Status: ${orderFinal?.status} (Remains: CONFIRMED)`);
    console.log(`✓ Payment Final Status: ${orderFinal?.payment?.status} (Remains: PAID)`);
    if (orderFinal?.payment?.status !== "PAID" || orderFinal?.status !== "CONFIRMED") {
      throw new Error("Late failure webhook mutated a PAID order!");
    }
  } catch (err: any) {
    console.error("Database test error:", err);
    throw err;
  } finally {
    if (testOrderId) {
      console.log("\n[CLEANUP] Cleaning up test order & audit logs...");
      await prisma.auditLog.deleteMany({ where: { entityId: testOrderId } });
      await prisma.payment.deleteMany({ where: { orderId: testOrderId } });
      await prisma.order.deleteMany({ where: { id: testOrderId } });
      console.log("✓ Cleanup completed.");
    }
  }

  // ----------------------------------------------------
  // TEST 11: order.paid Webhook Event with Database Order
  // ----------------------------------------------------
  console.log("\n[TEST 11] Testing order.paid Webhook Event with Database Order...");
  let orderPaidDbId: string | null = null;
  const mockOrderPaidRzpOrderId = `order_op_test_${Date.now()}`;
  const mockOrderPaidRzpPaymentId = `pay_op_test_${Date.now()}`;

  try {
    const opOrder = await prisma.order.create({
      data: {
        orderNumber: `TEST-OP-${Date.now().toString(36).toUpperCase()}`,
        status: "ORDER_PLACED",
        subtotal: 1499.0,
        total: 1499.0,
        guestEmail: "order-paid-test@zudiopilot.com",
        payment: {
          create: {
            amount: 1499.0,
            currency: "INR",
            status: "PENDING",
            razorpayOrderId: mockOrderPaidRzpOrderId,
          },
        },
      },
      include: { payment: true },
    });
    orderPaidDbId = opOrder.id;
    console.log(`  Created test order for order.paid: #${opOrder.orderNumber} (ID: ${opOrder.id})`);

    const orderPaidPayload = JSON.stringify({
      event: "order.paid",
      payload: {
        order: {
          entity: {
            id: mockOrderPaidRzpOrderId,
            amount: 149900,
            status: "paid",
          },
        },
        payment: {
          entity: {
            id: mockOrderPaidRzpPaymentId,
            order_id: mockOrderPaidRzpOrderId,
            amount: 149900,
            currency: "INR",
            status: "captured",
            method: "netbanking",
          },
        },
      },
    });

    const orderPaidSig = crypto
      .createHmac("sha256", testSecret)
      .update(orderPaidPayload)
      .digest("hex");

    const opResult1 = await handleRazorpayWebhook(orderPaidPayload, orderPaidSig);
    console.log(`✓ Webhook Processed: status=${opResult1.status}, orderId=${opResult1.orderId}`);
    if (opResult1.status !== "processed") {
      throw new Error(`Expected order.paid status 'processed', got '${opResult1.status}'`);
    }

    const opOrderAfter = await prisma.order.findUnique({
      where: { id: orderPaidDbId },
      include: { payment: true },
    });

    console.log(`✓ Order Status Updated: ${opOrderAfter?.status} (Expected: CONFIRMED)`);
    console.log(`✓ Payment Status Updated: ${opOrderAfter?.payment?.status} (Expected: PAID)`);
    console.log(`✓ Payment Method: ${opOrderAfter?.payment?.paymentMethod} (Expected: netbanking)`);
    if (opOrderAfter?.status !== "CONFIRMED" || opOrderAfter?.payment?.status !== "PAID") {
      throw new Error("order.paid did not transition order to CONFIRMED / PAID.");
    }

    // Verify Audit Log count
    const opAuditCount1 = await prisma.auditLog.count({
      where: { entityId: orderPaidDbId, action: "PAYMENT_WEBHOOK_PROCESSED" },
    });
    console.log(`✓ Audit Log Created: ${opAuditCount1} (Expected: 1)`);
    if (opAuditCount1 !== 1) throw new Error("Expected exactly 1 audit log for order.paid");

    // Duplicate order.paid
    const opResult2 = await handleRazorpayWebhook(orderPaidPayload, orderPaidSig);
    console.log(`✓ Duplicate order.paid Result: status=${opResult2.status}`);
    if (opResult2.status !== "already_processed") {
      throw new Error("Duplicate order.paid was not handled idempotently.");
    }

    const opAuditCount2 = await prisma.auditLog.count({
      where: { entityId: orderPaidDbId, action: "PAYMENT_WEBHOOK_PROCESSED" },
    });
    if (opAuditCount2 !== 1) throw new Error("Duplicate order.paid generated duplicate audit log!");
    console.log(`✓ Audit Log Count After Duplicate: ${opAuditCount2} (Confirmed No Duplicate Logs)`);
  } finally {
    if (orderPaidDbId) {
      await prisma.auditLog.deleteMany({ where: { entityId: orderPaidDbId } });
      await prisma.payment.deleteMany({ where: { orderId: orderPaidDbId } });
      await prisma.order.deleteMany({ where: { id: orderPaidDbId } });
    }
  }

  // ----------------------------------------------------
  // TEST 12: Initial payment.failed on Unpaid Order
  // ----------------------------------------------------
  console.log("\n[TEST 12] Testing Initial payment.failed on Unpaid Order...");
  let failOrderDbId: string | null = null;
  const mockFailRzpOrderId = `order_fail_init_${Date.now()}`;
  const mockFailRzpPaymentId = `pay_fail_init_${Date.now()}`;

  try {
    const failOrder = await prisma.order.create({
      data: {
        orderNumber: `TEST-FAIL-${Date.now().toString(36).toUpperCase()}`,
        status: "ORDER_PLACED",
        subtotal: 799.0,
        total: 799.0,
        guestEmail: "fail-test@zudiopilot.com",
        payment: {
          create: {
            amount: 799.0,
            currency: "INR",
            status: "PENDING",
            razorpayOrderId: mockFailRzpOrderId,
          },
        },
      },
      include: { payment: true },
    });
    failOrderDbId = failOrder.id;
    console.log(`  Created test order for initial failure: #${failOrder.orderNumber} (ID: ${failOrder.id})`);

    const initialFailPayload = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: mockFailRzpPaymentId,
            order_id: mockFailRzpOrderId,
            amount: 79900,
            currency: "INR",
            status: "failed",
            error_code: "PAYMENT_FAILED",
            error_description: "Insufficient funds in customer account",
          },
        },
      },
    });

    const initialFailSig = crypto
      .createHmac("sha256", testSecret)
      .update(initialFailPayload)
      .digest("hex");

    const failResult1 = await handleRazorpayWebhook(initialFailPayload, initialFailSig);
    console.log(`✓ Webhook Processed: status=${failResult1.status}, message=${failResult1.message}`);
    if (failResult1.status !== "failed_recorded") {
      throw new Error(`Expected failure status 'failed_recorded', got '${failResult1.status}'`);
    }

    const failOrderAfter = await prisma.order.findUnique({
      where: { id: failOrderDbId },
      include: { payment: true },
    });

    console.log(`✓ Order Status: ${failOrderAfter?.status} (Expected: ORDER_PLACED - retryable)`);
    console.log(`✓ Payment Status: ${failOrderAfter?.payment?.status} (Expected: FAILED)`);
    console.log(`✓ Payment Razorpay ID: ${failOrderAfter?.payment?.razorpayPaymentId} (Expected: ${mockFailRzpPaymentId})`);
    if (failOrderAfter?.status !== "ORDER_PLACED" || failOrderAfter?.payment?.status !== "FAILED") {
      throw new Error("Initial failure did not update Payment to FAILED or altered Order state incorrectly.");
    }

    // Verify Audit Log count
    const failAuditCount1 = await prisma.auditLog.count({
      where: { entityId: failOrderDbId, action: "PAYMENT_WEBHOOK_FAILED" },
    });
    console.log(`✓ Audit Log Created: ${failAuditCount1} (Expected: 1)`);
    if (failAuditCount1 !== 1) throw new Error("Expected exactly 1 audit log for payment.failed");

    // Duplicate payment.failed
    const failResult2 = await handleRazorpayWebhook(initialFailPayload, initialFailSig);
    console.log(`✓ Duplicate payment.failed Result: status=${failResult2.status}`);

    const failAuditCount2 = await prisma.auditLog.count({
      where: { entityId: failOrderDbId, action: "PAYMENT_WEBHOOK_FAILED" },
    });
    if (failAuditCount2 !== 1) throw new Error("Duplicate payment.failed generated duplicate audit logs!");
    console.log(`✓ Audit Log Count After Duplicate: ${failAuditCount2} (Confirmed No Duplicate Logs)`);
  } finally {
    if (failOrderDbId) {
      await prisma.auditLog.deleteMany({ where: { entityId: failOrderDbId } });
      await prisma.payment.deleteMany({ where: { orderId: failOrderDbId } });
      await prisma.order.deleteMany({ where: { id: failOrderDbId } });
    }
  }

  console.log("\n==================================================");
  console.log(" ALL PHASE A1 RAZORPAY WEBHOOK TESTS PASSED! ✓");
  console.log("==================================================");
}

runPhaseA1Tests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

