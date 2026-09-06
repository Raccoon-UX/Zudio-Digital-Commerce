import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  handleRazorpayWebhook,
  verifyPaymentSignature,
  commitOrderInventory,
} from "../modules/payments/service";
import { updateAdminOrderStatus } from "../modules/admin/service";

const prisma = new PrismaClient();

async function runPhaseA2Tests() {
  console.log("==================================================");
  console.log(" RUNNING PHASE A2: INVENTORY & FULFILLMENT TESTS");
  console.log("==================================================\n");

  const testSecret = "whsec_phase_a2_test_secret_987654";
  process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;
  process.env.RAZORPAY_KEY_SECRET = testSecret;

  // Global test fixtures tracking for guaranteed cleanup
  const createdOrderIds: string[] = [];
  const createdStoreIds: string[] = [];
  const createdVariantIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdSizeIds: string[] = [];
  const createdColorIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdUserIds: string[] = [];

  try {
    // ----------------------------------------------------
    // SETUP: Shared Category, Product, Size, Color, Store, Variants, Admin User
    // ----------------------------------------------------
    console.log("[SETUP] Creating isolated test database fixtures...");
    const timestamp = Date.now().toString(36);

    const adminUser = await prisma.user.create({
      data: {
        email: `admin-a2-${timestamp}@zudiopilot.com`,
        name: "Admin A2 Tester",
        role: "ADMIN",
      },
    });
    createdUserIds.push(adminUser.id);

    const category = await prisma.category.create({
      data: {
        name: `A2 Test Category ${timestamp}`,
        slug: `a2-cat-${timestamp}`,
      },
    });
    createdCategoryIds.push(category.id);

    const sizeM = await prisma.size.create({
      data: { name: `M-${timestamp}`, sortOrder: 1 },
    });
    createdSizeIds.push(sizeM.id);

    const sizeL = await prisma.size.create({
      data: { name: `L-${timestamp}`, sortOrder: 2 },
    });
    createdSizeIds.push(sizeL.id);

    const color = await prisma.color.create({
      data: { name: `Navy-${timestamp}`, hexCode: "#000080" },
    });
    createdColorIds.push(color.id);

    const product = await prisma.product.create({
      data: {
        name: `A2 Test Shirt ${timestamp}`,
        slug: `a2-shirt-${timestamp}`,
        description: "Phase A2 Test Product",
        categoryId: category.id,
      },
    });
    createdProductIds.push(product.id);

    const variantA = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `SKU-A2-A-${timestamp}`,
        sizeId: sizeM.id,
        colorId: color.id,
        price: 999.0,
      },
    });
    createdVariantIds.push(variantA.id);

    const variantB = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `SKU-A2-B-${timestamp}`,
        sizeId: sizeL.id,
        colorId: color.id,
        price: 1299.0,
      },
    });
    createdVariantIds.push(variantB.id);

    const store = await prisma.store.create({
      data: {
        name: `Zudio Test Store ${timestamp}`,
        slug: `zudio-store-${timestamp}`,
        address: "123 Test Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        latitude: 12.9716,
        longitude: 77.5946,
        phone: "9876543210",
      },
    });
    createdStoreIds.push(store.id);

    // Initial Inventory Setup
    // Variant A: quantity 20, reservedQuantity 0 (20 available)
    // Variant B: quantity 10, reservedQuantity 7 (3 available)
    await prisma.inventory.create({
      data: {
        storeId: store.id,
        variantId: variantA.id,
        quantity: 20,
        reservedQuantity: 0,
      },
    });

    await prisma.inventory.create({
      data: {
        storeId: store.id,
        variantId: variantB.id,
        quantity: 10,
        reservedQuantity: 7,
      },
    });

    console.log("✓ Fixtures successfully initialized.\n");

    // ----------------------------------------------------
    // TEST A2-T1: Valid payment.captured decrements exact store inventory once
    // ----------------------------------------------------
    console.log("[TEST A2-T1] Testing Valid payment.captured decrements store inventory...");
    const order1RzpId = `order_t1_${Date.now()}`;
    const order1PayRzpId = `pay_t1_${Date.now()}`;

    const order1 = await prisma.order.create({
      data: {
        orderNumber: `ZUD-A2-T1-${timestamp}`,
        status: "ORDER_PLACED",
        storeId: store.id,
        subtotal: 999.0,
        total: 999.0,
        guestEmail: "t1@zudiopilot.com",
        items: {
          create: {
            variantId: variantA.id,
            productName: product.name,
            variantSku: variantA.sku,
            sizeName: "M",
            colorName: "Navy",
            unitPrice: 999.0,
            quantity: 3,
            subtotal: 2997.0,
          },
        },
        payment: {
          create: {
            amount: 999.0,
            currency: "INR",
            status: "PENDING",
            razorpayOrderId: order1RzpId,
          },
        },
      },
    });
    createdOrderIds.push(order1.id);

    const payloadT1 = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: order1PayRzpId,
            order_id: order1RzpId,
            amount: 99900,
            currency: "INR",
            status: "captured",
            method: "upi",
          },
        },
      },
    });
    const sigT1 = crypto.createHmac("sha256", testSecret).update(payloadT1).digest("hex");

    const resultT1 = await handleRazorpayWebhook(payloadT1, sigT1);
    console.log(`✓ Webhook Processed: status=${resultT1.status}`);

    const invAfterT1 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantA.id } },
    });
    console.log(`✓ Variant A Stock after T1: ${invAfterT1?.quantity} (Expected: 17, from 20 - 3)`);
    if (invAfterT1?.quantity !== 17) {
      throw new Error(`Expected Variant A quantity 17, got ${invAfterT1?.quantity}`);
    }

    const orderAfterT1 = await prisma.order.findUnique({ where: { id: order1.id } });
    if (orderAfterT1?.status !== "CONFIRMED") {
      throw new Error(`Expected order status CONFIRMED, got ${orderAfterT1?.status}`);
    }

    // ----------------------------------------------------
    // TEST A2-T2: Valid order.paid decrements exact store inventory once
    // ----------------------------------------------------
    console.log("\n[TEST A2-T2] Testing Valid order.paid decrements store inventory...");
    const order2RzpId = `order_t2_${Date.now()}`;
    const order2PayRzpId = `pay_t2_${Date.now()}`;

    const order2 = await prisma.order.create({
      data: {
        orderNumber: `ZUD-A2-T2-${timestamp}`,
        status: "ORDER_PLACED",
        storeId: store.id,
        subtotal: 999.0,
        total: 999.0,
        guestEmail: "t2@zudiopilot.com",
        items: {
          create: {
            variantId: variantA.id,
            productName: product.name,
            variantSku: variantA.sku,
            sizeName: "M",
            colorName: "Navy",
            unitPrice: 999.0,
            quantity: 2,
            subtotal: 1998.0,
          },
        },
        payment: {
          create: {
            amount: 999.0,
            currency: "INR",
            status: "PENDING",
            razorpayOrderId: order2RzpId,
          },
        },
      },
    });
    createdOrderIds.push(order2.id);

    const payloadT2 = JSON.stringify({
      event: "order.paid",
      payload: {
        order: { entity: { id: order2RzpId, amount: 99900, status: "paid" } },
        payment: {
          entity: {
            id: order2PayRzpId,
            order_id: order2RzpId,
            amount: 99900,
            currency: "INR",
            status: "captured",
            method: "card",
          },
        },
      },
    });
    const sigT2 = crypto.createHmac("sha256", testSecret).update(payloadT2).digest("hex");

    const resultT2 = await handleRazorpayWebhook(payloadT2, sigT2);
    console.log(`✓ Webhook Processed: status=${resultT2.status}`);

    const invAfterT2 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantA.id } },
    });
    console.log(`✓ Variant A Stock after T2: ${invAfterT2?.quantity} (Expected: 15, from 17 - 2)`);
    if (invAfterT2?.quantity !== 15) {
      throw new Error(`Expected Variant A quantity 15, got ${invAfterT2?.quantity}`);
    }

    // ----------------------------------------------------
    // TEST A2-T3: Duplicate webhook delivery does NOT double-decrement
    // ----------------------------------------------------
    console.log("\n[TEST A2-T3] Testing Duplicate Webhook Delivery Idempotency...");
    const dupResultT3 = await handleRazorpayWebhook(payloadT1, sigT1);
    console.log(`✓ Duplicate Webhook Response: status=${dupResultT3.status}`);
    if (dupResultT3.status !== "already_processed") {
      throw new Error(`Expected duplicate status 'already_processed', got '${dupResultT3.status}'`);
    }

    const invAfterT3 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantA.id } },
    });
    console.log(`✓ Variant A Stock after duplicate webhook: ${invAfterT3?.quantity} (Remains: 15)`);
    if (invAfterT3?.quantity !== 15) {
      throw new Error(`Inventory was double-decremented! Quantity is ${invAfterT3?.quantity}`);
    }

    // ----------------------------------------------------
    // TEST A2-T4: Concurrent client verification + webhook results in exactly ONE decrement
    // ----------------------------------------------------
    console.log("\n[TEST A2-T4] Testing Concurrent Client Verification + Webhook Race...");
    const order4RzpId = `order_t4_${Date.now()}`;
    const order4PayRzpId = `pay_t4_${Date.now()}`;

    const order4 = await prisma.order.create({
      data: {
        orderNumber: `ZUD-A2-T4-${timestamp}`,
        status: "ORDER_PLACED",
        storeId: store.id,
        subtotal: 999.0,
        total: 999.0,
        guestEmail: "t4@zudiopilot.com",
        items: {
          create: {
            variantId: variantA.id,
            productName: product.name,
            variantSku: variantA.sku,
            sizeName: "M",
            colorName: "Navy",
            unitPrice: 999.0,
            quantity: 5,
            subtotal: 4995.0,
          },
        },
        payment: {
          create: {
            amount: 999.0,
            currency: "INR",
            status: "PENDING",
            razorpayOrderId: order4RzpId,
          },
        },
      },
    });
    createdOrderIds.push(order4.id);

    const payloadT4 = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: order4PayRzpId,
            order_id: order4RzpId,
            amount: 99900,
            currency: "INR",
            status: "captured",
            method: "netbanking",
          },
        },
      },
    });
    const sigT4 = crypto.createHmac("sha256", testSecret).update(payloadT4).digest("hex");

    const [clientRes, webhookRes] = await Promise.all([
      verifyPaymentSignature({
        orderId: order4.id,
        razorpayOrderId: order4RzpId,
        razorpayPaymentId: order4PayRzpId,
        razorpaySignature: crypto.createHmac("sha256", testSecret).update(`${order4RzpId}|${order4PayRzpId}`).digest("hex"),
        paymentMethod: "netbanking",
      }),
      handleRazorpayWebhook(payloadT4, sigT4),
    ]);

    console.log(`✓ Client verification status: ${clientRes.status}`);
    console.log(`✓ Webhook status: ${webhookRes.status}`);

    const invAfterT4 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantA.id } },
    });
    console.log(`✓ Variant A Stock after concurrent execution: ${invAfterT4?.quantity} (Expected: 10, from 15 - 5)`);
    if (invAfterT4?.quantity !== 10) {
      throw new Error(`Concurrent race caused double decrement! Quantity is ${invAfterT4?.quantity}`);
    }

    // ----------------------------------------------------
    // TEST A2-T5: Multi-item order with one unavailable item performs ZERO partial decrements
    // ----------------------------------------------------
    console.log("\n[TEST A2-T5] Testing Multi-item All-or-Nothing (Zero Partial Decrements)...");
    const order5RzpId = `order_t5_${Date.now()}`;
    const order5PayRzpId = `pay_t5_${Date.now()}`;

    // Order requests:
    // Variant A: 2 units (available: 10) -> in stock
    // Variant B: 50 units (available: 3) -> OUT OF STOCK
    const order5 = await prisma.order.create({
      data: {
        orderNumber: `ZUD-A2-T5-${timestamp}`,
        status: "ORDER_PLACED",
        storeId: store.id,
        subtotal: 2999.0,
        total: 2999.0,
        guestEmail: "t5@zudiopilot.com",
        items: {
          create: [
            {
              variantId: variantA.id,
              productName: product.name,
              variantSku: variantA.sku,
              sizeName: "M",
              colorName: "Navy",
              unitPrice: 999.0,
              quantity: 2,
              subtotal: 1998.0,
            },
            {
              variantId: variantB.id,
              productName: product.name,
              variantSku: variantB.sku,
              sizeName: "L",
              colorName: "Navy",
              unitPrice: 1299.0,
              quantity: 50,
              subtotal: 64950.0,
            },
          ],
        },
        payment: {
          create: {
            amount: 2999.0,
            currency: "INR",
            status: "PENDING",
            razorpayOrderId: order5RzpId,
          },
        },
      },
    });
    createdOrderIds.push(order5.id);

    const payloadT5 = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: order5PayRzpId,
            order_id: order5RzpId,
            amount: 299900,
            currency: "INR",
            status: "captured",
            method: "card",
          },
        },
      },
    });
    const sigT5 = crypto.createHmac("sha256", testSecret).update(payloadT5).digest("hex");

    await handleRazorpayWebhook(payloadT5, sigT5);

    const invA_AfterT5 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantA.id } },
    });
    const invB_AfterT5 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantB.id } },
    });

    console.log(`✓ Variant A Stock after failed multi-item: ${invA_AfterT5?.quantity} (Remains: 10)`);
    console.log(`✓ Variant B Stock after failed multi-item: ${invB_AfterT5?.quantity} (Remains: 10)`);

    if (invA_AfterT5?.quantity !== 10 || invB_AfterT5?.quantity !== 10) {
      throw new Error("Partial decrement occurred on a multi-item fulfillment exception!");
    }

    const orderAfterT5 = await prisma.order.findUnique({ where: { id: order5.id } });
    console.log(`✓ Order 5 Status: ${orderAfterT5?.status} (Expected: PROCESSING)`);
    console.log(`✓ Order 5 Notes: ${orderAfterT5?.notes}`);
    if (orderAfterT5?.status !== "PROCESSING" || !orderAfterT5?.notes?.includes("FULFILLMENT_EXCEPTION")) {
      throw new Error("Order was not set to PROCESSING with FULFILLMENT_EXCEPTION note.");
    }

    // ----------------------------------------------------
    // TEST A2-T6: Insufficient stock never produces negative inventory
    // ----------------------------------------------------
    console.log("\n[TEST A2-T6] Testing Non-Negative Inventory Invariant...");
    const allInventories = await prisma.inventory.findMany({
      where: { storeId: store.id },
    });
    for (const inv of allInventories) {
      if (inv.quantity < 0) {
        throw new Error(`Negative inventory detected for variant ${inv.variantId}: ${inv.quantity}`);
      }
    }
    console.log("✓ Verified: All inventory quantities >= 0.");

    // ----------------------------------------------------
    // TEST A2-T7: Late payment.failed does not modify fulfilled inventory
    // ----------------------------------------------------
    console.log("\n[TEST A2-T7] Testing Late payment.failed ignores fulfilled inventory...");
    const lateFailPayload = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: `pay_late_fail_${Date.now()}`,
            order_id: order1RzpId, // Already fulfilled order 1
            error_code: "GATEWAY_TIMEOUT",
            error_description: "Late timeout",
          },
        },
      },
    });
    const lateFailSig = crypto.createHmac("sha256", testSecret).update(lateFailPayload).digest("hex");

    const lateFailRes = await handleRazorpayWebhook(lateFailPayload, lateFailSig);
    console.log(`✓ Late Failure Result: status=${lateFailRes.status}`);

    const invAfterLateFail = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantA.id } },
    });
    console.log(`✓ Variant A Stock after late failure: ${invAfterLateFail?.quantity} (Remains: 10)`);
    if (invAfterLateFail?.quantity !== 10) {
      throw new Error("Late payment failure modified inventory!");
    }

    // ----------------------------------------------------
    // TEST A2-T8: Admin cancellation inventory restoration rules
    // ----------------------------------------------------
    console.log("\n[TEST A2-T8] Testing Admin Order Cancellation Inventory Restoration...");

    // 1. CONFIRMED order cancellation restores committed inventory
    // Order 1 committed 3 units of Variant A (current Variant A quantity is 10)
    // Cancelling Order 1 must restore +3 units (10 -> 13)
    console.log("  [A2-T8.1] Cancelling CONFIRMED order (Order 1)...");
    await updateAdminOrderStatus(order1.id, "CANCELLED", { id: adminUser.id, name: adminUser.name });
    const invAfterCancel1 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantA.id } },
    });
    console.log(`  ✓ Variant A Stock after Order 1 cancellation: ${invAfterCancel1?.quantity} (Expected: 13, restored +3)`);
    if (invAfterCancel1?.quantity !== 13) {
      throw new Error(`Admin cancellation of CONFIRMED order failed to restore exact inventory! Got ${invAfterCancel1?.quantity}`);
    }

    // 2. Normal PROCESSING order with committed stock restores inventory
    // Order 2 committed 2 units of Variant A and is in CONFIRMED.
    // Move Order 2 to normal PROCESSING status first.
    console.log("  [A2-T8.2] Progressing Order 2 to normal PROCESSING and then cancelling...");
    await updateAdminOrderStatus(order2.id, "PROCESSING", { id: adminUser.id, name: adminUser.name });
    await updateAdminOrderStatus(order2.id, "CANCELLED", { id: adminUser.id, name: adminUser.name });
    const invAfterCancel2 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantA.id } },
    });
    console.log(`  ✓ Variant A Stock after Order 2 cancellation: ${invAfterCancel2?.quantity} (Expected: 15, restored +2)`);
    if (invAfterCancel2?.quantity !== 15) {
      throw new Error(`Admin cancellation of normal PROCESSING order failed to restore inventory! Got ${invAfterCancel2?.quantity}`);
    }

    // 3. PROCESSING order with FULFILLMENT_EXCEPTION restores ZERO inventory (Prevents Phantom Stock)
    // Order 5 is in PROCESSING because of FULFILLMENT_EXCEPTION (requested 2 of Var A, 50 of Var B, committed 0).
    // Cancelling Order 5 must NOT increment inventory for Variant A (remains 15) or Variant B (remains 10).
    console.log("  [A2-T8.3] Cancelling PROCESSING order with FULFILLMENT_EXCEPTION (Order 5)...");
    await updateAdminOrderStatus(order5.id, "CANCELLED", { id: adminUser.id, name: adminUser.name });
    const invA_AfterCancel5 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantA.id } },
    });
    const invB_AfterCancel5 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantB.id } },
    });
    console.log(`  ✓ Variant A Stock after Order 5 cancellation: ${invA_AfterCancel5?.quantity} (Expected: 15, unchanged)`);
    console.log(`  ✓ Variant B Stock after Order 5 cancellation: ${invB_AfterCancel5?.quantity} (Expected: 10, unchanged)`);
    if (invA_AfterCancel5?.quantity !== 15 || invB_AfterCancel5?.quantity !== 10) {
      throw new Error(`Cancelling FULFILLMENT_EXCEPTION order incorrectly created phantom stock! VarA=${invA_AfterCancel5?.quantity}, VarB=${invB_AfterCancel5?.quantity}`);
    }

    // ----------------------------------------------------
    // TEST A2-T9: AuditLog contains useful variant/store/quantity before-after information
    // ----------------------------------------------------
    console.log("\n[TEST A2-T9] Testing AuditLog Details Structure...");
    const fulfillmentAudit = await prisma.auditLog.findFirst({
      where: {
        entityId: order2.id,
        action: "INVENTORY_FULFILLMENT_COMMITTED",
      },
    });

    console.log(`✓ Found Audit Log: action=${fulfillmentAudit?.action}`);
    const details = fulfillmentAudit?.details as any;
    console.log(`  Details: orderNumber=${details?.orderNumber}, storeId=${details?.allocatedStoreId}, itemsCount=${details?.items?.length}`);
    if (!details?.items || details.items.length === 0 || details.items[0].quantityBefore === undefined || details.items[0].quantityAfter === undefined) {
      throw new Error("Audit log is missing detailed before/after item quantities!");
    }
    console.log(`  Item Detail: ${details.items[0].productName} before=${details.items[0].quantityBefore}, after=${details.items[0].quantityAfter}`);

    // ----------------------------------------------------
    // TEST A2-T10: Reserved Stock Protection Rule
    // Store has: quantity = 10, reservedQuantity = 7 (available = 3)
    // Order requests 4. Must fail with ZERO decrements.
    // ----------------------------------------------------
    console.log("\n[TEST A2-T10] Testing Critical Reserved Stock Protection Rule...");
    // Current Variant B in store: quantity = 10, reservedQuantity = 7
    const order10RzpId = `order_t10_${Date.now()}`;
    const order10PayRzpId = `pay_t10_${Date.now()}`;

    const order10 = await prisma.order.create({
      data: {
        orderNumber: `ZUD-A2-T10-${timestamp}`,
        status: "ORDER_PLACED",
        storeId: store.id,
        subtotal: 1299.0,
        total: 1299.0,
        guestEmail: "t10@zudiopilot.com",
        items: {
          create: {
            variantId: variantB.id,
            productName: product.name,
            variantSku: variantB.sku,
            sizeName: "L",
            colorName: "Navy",
            unitPrice: 1299.0,
            quantity: 4, // Requests 4, but only 3 available!
            subtotal: 5196.0,
          },
        },
        payment: {
          create: {
            amount: 1299.0,
            currency: "INR",
            status: "PENDING",
            razorpayOrderId: order10RzpId,
          },
        },
      },
    });
    createdOrderIds.push(order10.id);

    const payloadT10 = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: order10PayRzpId,
            order_id: order10RzpId,
            amount: 129900,
            currency: "INR",
            status: "captured",
            method: "upi",
          },
        },
      },
    });
    const sigT10 = crypto.createHmac("sha256", testSecret).update(payloadT10).digest("hex");

    await handleRazorpayWebhook(payloadT10, sigT10);

    const invB_AfterT10 = await prisma.inventory.findUnique({
      where: { storeId_variantId: { storeId: store.id, variantId: variantB.id } },
    });

    console.log(`✓ Variant B physical quantity: ${invB_AfterT10?.quantity} (Expected: 10, unchanged)`);
    console.log(`✓ Variant B reserved quantity: ${invB_AfterT10?.reservedQuantity} (Expected: 7, unchanged)`);

    if (invB_AfterT10?.quantity !== 10 || invB_AfterT10?.reservedQuantity !== 7) {
      throw new Error(`Reserved stock was illegally consumed! Quantity=${invB_AfterT10?.quantity}, Reserved=${invB_AfterT10?.reservedQuantity}`);
    }

    const orderAfterT10 = await prisma.order.findUnique({ where: { id: order10.id } });
    console.log(`✓ Order 10 Status: ${orderAfterT10?.status} (Expected: PROCESSING)`);
    if (orderAfterT10?.status !== "PROCESSING") {
      throw new Error(`Expected Order 10 to be in PROCESSING state, got ${orderAfterT10?.status}`);
    }

    console.log("\n==================================================");
    console.log(" ALL PHASE A2 INTEGRATION TESTS (A2-T1 to A2-T10) PASSED! ✓");
    console.log("==================================================");
  } finally {
    console.log("\n[CLEANUP] Cleaning up test fixtures...");
    for (const orderId of createdOrderIds) {
      await prisma.auditLog.deleteMany({ where: { entityId: orderId } });
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    for (const userId of createdUserIds) {
      await prisma.auditLog.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    for (const storeId of createdStoreIds) {
      await prisma.inventory.deleteMany({ where: { storeId } });
      await prisma.store.deleteMany({ where: { id: storeId } });
    }
    for (const varId of createdVariantIds) {
      await prisma.productVariant.deleteMany({ where: { id: varId } });
    }
    for (const prodId of createdProductIds) {
      await prisma.product.deleteMany({ where: { id: prodId } });
    }
    for (const sizeId of createdSizeIds) {
      await prisma.size.deleteMany({ where: { id: sizeId } });
    }
    for (const colorId of createdColorIds) {
      await prisma.color.deleteMany({ where: { id: colorId } });
    }
    for (const catId of createdCategoryIds) {
      await prisma.category.deleteMany({ where: { id: catId } });
    }
    console.log("✓ Cleanup finished.");
  }
}

runPhaseA2Tests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
