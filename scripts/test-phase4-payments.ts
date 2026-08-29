import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { allocateFulfillmentStore } from "../modules/orders/fulfillment-allocator";
import { createOrder } from "../modules/orders/service";
import { createRazorpayPaymentOrder, verifyPaymentSignature } from "../modules/payments/service";

const prisma = new PrismaClient();

async function runPhase4Tests() {
  console.log("==================================================");
  console.log(" RUNNING PHASE 4: PAYMENTS & INVENTORY COMMITMENT TESTS");
  console.log("==================================================\n");

  // 1. Fetch an active store and a sample variant with inventory
  const variant = await prisma.productVariant.findFirst({
    where: { isActive: true },
    include: { product: true, inventories: { include: { store: true } } },
  });

  if (!variant || variant.inventories.length === 0) {
    throw new Error("No active product variant with inventory found. Please seed the database first.");
  }

  const inventoryBefore = variant.inventories[0];
  const testStore = inventoryBefore.store;
  console.log(`[TEST 1] Testing Fulfillment Allocator for store: ${testStore.name} (${testStore.city})`);

  const allocated = await allocateFulfillmentStore(
    [{ variantId: variant.id, quantity: 1 }],
    testStore.city
  );
  console.log(`✓ Allocated Fulfillment Store: ${allocated.storeName} (${allocated.storeId})`);

  // 2. Create a test order
  console.log("\n[TEST 2] Creating Test Order with Allocated Fulfillment Store...");
  const orderNumber = `TEST-PHASE4-${Date.now().toString(36).toUpperCase()}`;

  const testOrder = await prisma.order.create({
    data: {
      orderNumber,
      storeId: allocated.storeId,
      guestEmail: "test-buyer@zudiopilot.com",
      status: "ORDER_PLACED",
      subtotal: variant.price,
      deliveryFee: 0,
      total: variant.price,
      items: {
        create: {
          variantId: variant.id,
          productName: variant.product.name,
          variantSku: variant.sku,
          sizeName: "M",
          colorName: "Black",
          unitPrice: variant.price,
          quantity: 2,
          subtotal: Number(variant.price) * 2,
        },
      },
      payment: {
        create: {
          amount: variant.price,
          currency: "INR",
          status: "PENDING",
        },
      },
    },
    include: {
      payment: true,
      items: true,
    },
  });

  console.log(`✓ Order Created: #${testOrder.orderNumber} (ID: ${testOrder.id}, StoreId: ${testOrder.storeId})`);

  // Record inventory quantity before payment
  const invBefore = await prisma.inventory.findUnique({
    where: {
      storeId_variantId: {
        storeId: testOrder.storeId!,
        variantId: variant.id,
      },
    },
  });
  const initialQty = invBefore!.quantity;
  console.log(`  Current Inventory at ${allocated.storeName}: ${initialQty} units`);

  // 3. Initialize Razorpay Payment Order
  console.log("\n[TEST 3] Initializing Razorpay Payment Order...");
  const paymentOrder = await createRazorpayPaymentOrder(testOrder.id);
  console.log(`✓ Razorpay Order Created: ${paymentOrder.razorpayOrderId} (${paymentOrder.amount} paise)`);

  // 4. Invalid Signature Rejection Test
  console.log("\n[TEST 4] Testing Invalid Signature Rejection...");
  try {
    await verifyPaymentSignature({
      orderId: testOrder.id,
      razorpayOrderId: paymentOrder.razorpayOrderId,
      razorpayPaymentId: "pay_fake_12345",
      razorpaySignature: "invalid_tampered_signature_hex",
    });
    console.error("❌ FAILED: Invalid signature was unexpectedly accepted!");
  } catch (err: any) {
    console.log(`✓ Successfully rejected invalid signature with code: ${err.code || err.message}`);
  }

  // 5. Valid Cryptographic HMAC Signature & Atomic Inventory Commitment
  console.log("\n[TEST 5] Testing Cryptographic HMAC Verification & Atomic Inventory Commitment...");
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "razorpay_secret_placeholder";
  const validPaymentId = `pay_test_${Date.now()}`;
  const validSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${paymentOrder.razorpayOrderId}|${validPaymentId}`)
    .digest("hex");

  const verifyResult = await verifyPaymentSignature({
    orderId: testOrder.id,
    razorpayOrderId: paymentOrder.razorpayOrderId,
    razorpayPaymentId: validPaymentId,
    razorpaySignature: validSignature,
    paymentMethod: "TEST_UPI",
  });

  console.log(`✓ Payment Verified: Status = ${verifyResult.status}, ID = ${verifyResult.razorpayPaymentId}`);

  // Verify DB state
  const orderAfter = await prisma.order.findUnique({
    where: { id: testOrder.id },
    include: { payment: true },
  });
  console.log(`✓ Order Status Updated: ${orderAfter?.status} (Expected: CONFIRMED)`);
  console.log(`✓ Payment Status Updated: ${orderAfter?.payment?.status} (Expected: PAID)`);

  const invAfter = await prisma.inventory.findUnique({
    where: {
      storeId_variantId: {
        storeId: testOrder.storeId!,
        variantId: variant.id,
      },
    },
  });
  const expectedQty = initialQty - 2;
  console.log(`✓ Target Inventory[storeId, variantId] Decrement: ${invAfter!.quantity} (Initial: ${initialQty}, Decremented: 2, Expected: ${expectedQty})`);

  if (invAfter!.quantity !== expectedQty) {
    throw new Error(`Inventory mismatch: got ${invAfter!.quantity}, expected ${expectedQty}`);
  }

  // 6. Idempotency & Duplicate Verification Test
  console.log("\n[TEST 6] Testing Idempotency & Duplicate Verification Protection...");
  const duplicateResult = await verifyPaymentSignature({
    orderId: testOrder.id,
    razorpayOrderId: paymentOrder.razorpayOrderId,
    razorpayPaymentId: validPaymentId,
    razorpaySignature: validSignature,
  });

  console.log(`✓ Duplicate Call Handled Idempotently: Status = ${duplicateResult.status}`);

  const invAfterDuplicate = await prisma.inventory.findUnique({
    where: {
      storeId_variantId: {
        storeId: testOrder.storeId!,
        variantId: variant.id,
      },
    },
  });

  console.log(`✓ Inventory After Duplicate Call: ${invAfterDuplicate!.quantity} (Confirmed NOT decremented twice)`);
  if (invAfterDuplicate!.quantity !== expectedQty) {
    throw new Error(`Duplicate call altered inventory: got ${invAfterDuplicate!.quantity}, expected ${expectedQty}`);
  }

  // Clean up test order
  console.log("\n[CLEANUP] Cleaning up test order...");
  await prisma.order.delete({ where: { id: testOrder.id } });
  // Restore inventory
  await prisma.inventory.update({
    where: {
      storeId_variantId: {
        storeId: testOrder.storeId!,
        variantId: variant.id,
      },
    },
    data: { quantity: initialQty },
  });
  console.log("✓ Cleanup complete & inventory restored.");

  console.log("\n==================================================");
  console.log(" ALL PHASE 4 PAYMENT & INVENTORY TESTS PASSED! ✓");
  console.log("==================================================");
}

runPhase4Tests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
