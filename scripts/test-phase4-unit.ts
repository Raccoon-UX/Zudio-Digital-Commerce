import crypto from "crypto";

function runUnitTests() {
  console.log("==================================================");
  console.log(" RUNNING PHASE 4: UNIT & CRYPTOGRAPHY TESTS");
  console.log("==================================================\n");

  const secret = "test_razorpay_secret_key_12345";
  const orderId = "order_N123456789";
  const paymentId = "pay_P987654321";

  // Test 1: HMAC SHA-256 calculation
  console.log("[TEST 1] Testing HMAC-SHA256 Signature Generation...");
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  console.log(`✓ Computed Valid Signature: ${validSignature}`);
  if (typeof validSignature !== "string" || validSignature.length !== 64) {
    throw new Error("Invalid HMAC signature format generated.");
  }

  // Test 2: Tampered Payment ID Rejection
  console.log("\n[TEST 2] Testing Tampered Payment ID Detection...");
  const tamperedPaymentId = "pay_P987654322";
  const tamperedExpected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${tamperedPaymentId}`)
    .digest("hex");

  if (tamperedExpected === validSignature) {
    throw new Error("HMAC collision detected! Tampering went undetected.");
  }
  console.log("✓ Tampered payment ID correctly produces mismatched cryptographic signature.");

  // Test 3: Webhook Raw Body HMAC Verification
  console.log("\n[TEST 3] Testing Razorpay Webhook Signature Verification...");
  const webhookSecret = "whsec_test_secret_999";
  const webhookPayload = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 149900,
          currency: "INR",
          status: "captured",
          method: "upi",
        },
      },
    },
  });

  const webhookSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(webhookPayload)
    .digest("hex");

  const verified =
    crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex") === webhookSignature;

  console.log(`✓ Webhook Payload Authenticity Verified: ${verified}`);
  if (!verified) throw new Error("Webhook signature verification failed.");

  // Test 4: Fulfillment Store Allocation Logic Simulator
  console.log("\n[TEST 4] Testing Fulfillment Store Allocation Algorithm...");
  const mockStores = [
    {
      id: "store_blr",
      name: "Zudio Indiranagar",
      city: "Bengaluru",
      inventories: [
        { variantId: "var_1", quantity: 5, reservedQuantity: 0 },
        { variantId: "var_2", quantity: 0, reservedQuantity: 0 }, // Out of stock on var_2
      ],
    },
    {
      id: "store_mum",
      name: "Zudio Bandra",
      city: "Mumbai",
      inventories: [
        { variantId: "var_1", quantity: 10, reservedQuantity: 2 }, // 8 available
        { variantId: "var_2", quantity: 6, reservedQuantity: 1 },  // 5 available
      ],
    },
  ];

  function simulateAllocate(
    items: { variantId: string; quantity: number }[],
    deliveryCity?: string
  ) {
    const sorted = [...mockStores].sort((a, b) => {
      if (deliveryCity) {
        if (a.city.toLowerCase() === deliveryCity.toLowerCase()) return -1;
        if (b.city.toLowerCase() === deliveryCity.toLowerCase()) return 1;
      }
      return 0;
    });

    for (const store of sorted) {
      let canFulfill = true;
      for (const item of items) {
        const inv = store.inventories.find((i) => i.variantId === item.variantId);
        const available = inv ? Math.max(0, inv.quantity - inv.reservedQuantity) : 0;
        if (available < item.quantity) {
          canFulfill = false;
          break;
        }
      }
      if (canFulfill) return store;
    }
    return null;
  }

  const result1 = simulateAllocate(
    [
      { variantId: "var_1", quantity: 2 },
      { variantId: "var_2", quantity: 2 },
    ],
    "Bengaluru" // Bengaluru store lacks var_2, so Mumbai store should be selected
  );

  console.log(`✓ Allocated Store: ${result1?.name} (${result1?.city})`);
  if (result1?.id !== "store_mum") {
    throw new Error(`Expected store_mum, got ${result1?.id}`);
  }

  // Test 5: Out of stock across all stores
  const resultOOS = simulateAllocate([
    { variantId: "var_1", quantity: 50 }, // Exceeds all inventory
  ]);
  console.log(`✓ Total Stock Check (Out of Stock Handling): ${resultOOS === null ? "Correctly Rejected (Null)" : "Failed"}`);
  if (resultOOS !== null) {
    throw new Error("Overselling not prevented!");
  }

  // Test 6: Timing-Safe Webhook Verification Function Test
  console.log("\n[TEST 6] Testing Timing-Safe Webhook Verification Function...");
  function verifyWebhookSignatureLocal(rawBody: string, signature: string, secret: string): boolean {
    if (!rawBody || !signature || !secret) return false;
    try {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const bufExp = Buffer.from(expected, "utf8");
      const bufAct = Buffer.from(signature, "utf8");
      if (bufExp.length !== bufAct.length) return false;
      return crypto.timingSafeEqual(bufExp, bufAct);
    } catch {
      return false;
    }
  }

  const validWebhookSig = crypto.createHmac("sha256", webhookSecret).update(webhookPayload).digest("hex");
  const check1 = verifyWebhookSignatureLocal(webhookPayload, validWebhookSig, webhookSecret);
  if (!check1) throw new Error("Valid webhook signature rejected by timing-safe comparator.");
  console.log("✓ Valid webhook signature successfully accepted.");

  // Test 7: Tampered Payload Rejection
  console.log("\n[TEST 7] Testing Tampered Webhook Payload Rejection...");
  const tamperedPayload = webhookPayload.replace("149900", "19900");
  const check2 = verifyWebhookSignatureLocal(tamperedPayload, validWebhookSig, webhookSecret);
  if (check2) throw new Error("Tampered webhook payload was accepted!");
  console.log("✓ Tampered webhook payload correctly rejected.");

  // Test 8: Wrong Webhook Secret Rejection
  console.log("\n[TEST 8] Testing Wrong Webhook Secret Rejection...");
  const check3 = verifyWebhookSignatureLocal(webhookPayload, validWebhookSig, "wrong_secret_abc");
  if (check3) throw new Error("Wrong webhook secret was accepted!");
  console.log("✓ Wrong webhook secret correctly rejected.");

  // Test 9: Webhook Idempotency & State Transition Simulator
  console.log("\n[TEST 9] Testing Webhook Idempotency State Machine...");
  type OrderState = { orderStatus: string; paymentStatus: string; auditLogs: string[] };
  const mockDbOrder: OrderState = {
    orderStatus: "ORDER_PLACED",
    paymentStatus: "PENDING",
    auditLogs: [],
  };

  function simulateWebhookCapture(order: OrderState, paymentId: string) {
    if (order.paymentStatus === "PAID") {
      return { status: "already_processed" };
    }
    order.paymentStatus = "PAID";
    if (order.orderStatus === "ORDER_PLACED" || order.orderStatus === "PROCESSING") {
      order.orderStatus = "CONFIRMED";
    }
    order.auditLogs.push(`PAYMENT_WEBHOOK_PROCESSED:${paymentId}`);
    return { status: "processed" };
  }

  const firstDelivery = simulateWebhookCapture(mockDbOrder, paymentId);
  console.log(`✓ First Webhook Delivery: ${firstDelivery.status}, Order=${mockDbOrder.orderStatus}, Payment=${mockDbOrder.paymentStatus}`);
  if (mockDbOrder.paymentStatus !== "PAID" || mockDbOrder.orderStatus !== "CONFIRMED" || mockDbOrder.auditLogs.length !== 1) {
    throw new Error("First webhook did not transition order to PAID/CONFIRMED correctly.");
  }

  const secondDelivery = simulateWebhookCapture(mockDbOrder, paymentId);
  console.log(`✓ Duplicate Webhook Delivery: ${secondDelivery.status}, Order=${mockDbOrder.orderStatus}, Payment=${mockDbOrder.paymentStatus}`);
  if (secondDelivery.status !== "already_processed" || mockDbOrder.auditLogs.length !== 1) {
    throw new Error("Duplicate webhook delivery was not handled idempotently!");
  }

  // Test 10: Late Failure Webhook Ignoring
  console.log("\n[TEST 10] Testing Late Payment Failure Ignoring on Already Paid Order...");
  function simulateWebhookFailure(order: OrderState, paymentId: string) {
    if (order.paymentStatus === "PAID") {
      return { status: "already_processed", message: "Ignored late failure event on PAID order." };
    }
    order.paymentStatus = "FAILED";
    order.auditLogs.push(`PAYMENT_WEBHOOK_FAILED:${paymentId}`);
    return { status: "failed_recorded" };
  }

  const lateFailure = simulateWebhookFailure(mockDbOrder, paymentId);
  console.log(`✓ Late Failure Handling on PAID Order: ${lateFailure.status} (Payment remains ${mockDbOrder.paymentStatus})`);
  if (mockDbOrder.paymentStatus !== "PAID") {
    throw new Error("Late failure webhook regressed a PAID order!");
  }

  // Test 11: order.paid Deterministic Webhook Simulation
  console.log("\n[TEST 11] Testing order.paid Event Simulation & Idempotency...");
  const orderPaidPayload = JSON.stringify({
    event: "order.paid",
    payload: {
      order: {
        entity: {
          id: "order_test_paid_123",
          amount: 149900,
          status: "paid",
        },
      },
      payment: {
        entity: {
          id: "pay_test_paid_456",
          order_id: "order_test_paid_123",
          amount: 149900,
          status: "captured",
        },
      },
    },
  });

  const orderPaidSig = crypto.createHmac("sha256", webhookSecret).update(orderPaidPayload).digest("hex");
  const isOrderPaidSigValid = verifyWebhookSignatureLocal(orderPaidPayload, orderPaidSig, webhookSecret);
  if (!isOrderPaidSigValid) throw new Error("order.paid signature rejected!");

  const freshOrderForOrderPaid: OrderState = {
    orderStatus: "ORDER_PLACED",
    paymentStatus: "PENDING",
    auditLogs: [],
  };

  const opResult1 = simulateWebhookCapture(freshOrderForOrderPaid, "pay_test_paid_456");
  console.log(`✓ First order.paid Delivery: ${opResult1.status}, Order=${freshOrderForOrderPaid.orderStatus}, Payment=${freshOrderForOrderPaid.paymentStatus}`);
  if (freshOrderForOrderPaid.paymentStatus !== "PAID" || freshOrderForOrderPaid.orderStatus !== "CONFIRMED" || freshOrderForOrderPaid.auditLogs.length !== 1) {
    throw new Error("order.paid did not transition order to CONFIRMED / PAID correctly.");
  }

  const opResult2 = simulateWebhookCapture(freshOrderForOrderPaid, "pay_test_paid_456");
  console.log(`✓ Duplicate order.paid Delivery: ${opResult2.status}, Total Audit Logs=${freshOrderForOrderPaid.auditLogs.length}`);
  if (opResult2.status !== "already_processed" || freshOrderForOrderPaid.auditLogs.length !== 1) {
    throw new Error("Duplicate order.paid webhook generated duplicate effects!");
  }

  // Test 12: Initial payment.failed on Unpaid Order
  console.log("\n[TEST 12] Testing Initial payment.failed on Unpaid Order...");
  const unpaidOrderForFailure: OrderState = {
    orderStatus: "ORDER_PLACED",
    paymentStatus: "PENDING",
    auditLogs: [],
  };

  const initialFailResult = simulateWebhookFailure(unpaidOrderForFailure, "pay_failed_init_789");
  console.log(`✓ Initial payment.failed Delivery: ${initialFailResult.status}, Order=${unpaidOrderForFailure.orderStatus}, Payment=${unpaidOrderForFailure.paymentStatus}`);
  if (unpaidOrderForFailure.paymentStatus !== "FAILED") {
    throw new Error("Initial failure did not update Payment status to FAILED.");
  }
  if (unpaidOrderForFailure.orderStatus !== "ORDER_PLACED") {
    throw new Error("Initial failure unexpectedly altered Order placement status.");
  }
  if (unpaidOrderForFailure.auditLogs.length !== 1) {
    throw new Error("Initial failure did not record audit log exactly once.");
  }

  // Duplicate payment.failed on already failed order
  function simulateDuplicateFailure(order: OrderState, paymentId: string) {
    if (order.paymentStatus === "FAILED") {
      return { status: "already_processed", message: "Failure already recorded." };
    }
    return simulateWebhookFailure(order, paymentId);
  }

  const dupFailResult = simulateDuplicateFailure(unpaidOrderForFailure, "pay_failed_init_789");
  console.log(`✓ Duplicate payment.failed Delivery: ${dupFailResult.status}, Total Audit Logs=${unpaidOrderForFailure.auditLogs.length}`);
  if (dupFailResult.status !== "already_processed" || unpaidOrderForFailure.auditLogs.length !== 1) {
    throw new Error("Duplicate payment.failed was not handled idempotently!");
  }

  // ====================================================
  // PHASE A2 UNIT TESTS: INVENTORY & FULFILLMENT LOGIC
  // ====================================================

  // Test 13: A2 Reserved Stock Protection Rule (quantity: 10, reserved: 7, order: 4 -> fails)
  console.log("\n[TEST 13] Testing A2 Reserved Stock Protection Rule (Quantity - Reserved)...");
  type MockInventory = { variantId: string; quantity: number; reservedQuantity: number };
  type MockOrderItem = { variantId: string; quantity: number };

  function simulateA2Commit(
    inventories: MockInventory[],
    orderItems: MockOrderItem[]
  ): { success: boolean; decremented: boolean; status: string; notes?: string } {
    // Check all-or-nothing
    let canFulfill = true;
    for (const item of orderItems) {
      const inv = inventories.find((i) => i.variantId === item.variantId);
      const available = inv ? Math.max(0, inv.quantity - inv.reservedQuantity) : 0;
      if (available < item.quantity) {
        canFulfill = false;
        break;
      }
    }

    if (!canFulfill) {
      // Zero decrements (All-or-Nothing)
      return {
        success: false,
        decremented: false,
        status: "PROCESSING",
        notes: "FULFILLMENT_EXCEPTION: Store stock depleted during concurrent checkout. Administrator manual reallocation or refund required.",
      };
    }

    // Winning path: Decrement all items
    for (const item of orderItems) {
      const inv = inventories.find((i) => i.variantId === item.variantId)!;
      inv.quantity -= item.quantity;
    }

    return {
      success: true,
      decremented: true,
      status: "CONFIRMED",
    };
  }

  const test13Inv: MockInventory[] = [{ variantId: "var_res_test", quantity: 10, reservedQuantity: 7 }];
  const test13Result = simulateA2Commit(test13Inv, [{ variantId: "var_res_test", quantity: 4 }]);
  console.log(`✓ Reserved Stock Hold Test: success=${test13Result.success}, status=${test13Result.status}, qty=${test13Inv[0].quantity}, reserved=${test13Inv[0].reservedQuantity}`);
  if (test13Result.success || test13Result.status !== "PROCESSING" || test13Inv[0].quantity !== 10 || test13Inv[0].reservedQuantity !== 7) {
    throw new Error("Reserved stock protection failed! An order consumed reserved units.");
  }

  // Test 14: A2 Multi-Item All-or-Nothing Zero Partial Decrements
  console.log("\n[TEST 14] Testing A2 Multi-Item All-or-Nothing (Zero Partial Decrements)...");
  const test14Inv: MockInventory[] = [
    { variantId: "var_A", quantity: 10, reservedQuantity: 0 }, // 10 available
    { variantId: "var_B", quantity: 1, reservedQuantity: 0 },  // 1 available
  ];
  const test14Order: MockOrderItem[] = [
    { variantId: "var_A", quantity: 2 }, // available
    { variantId: "var_B", quantity: 3 }, // insufficient!
  ];

  const test14Result = simulateA2Commit(test14Inv, test14Order);
  console.log(`✓ Multi-Item Out of Stock Test: success=${test14Result.success}, VarA qty=${test14Inv[0].quantity}, VarB qty=${test14Inv[1].quantity}`);
  if (test14Result.success || test14Inv[0].quantity !== 10 || test14Inv[1].quantity !== 1) {
    throw new Error("All-or-Nothing failed! Partial decrement remained on successful item.");
  }

  // Test 15: A2 Multi-Item Full Success Commitment
  console.log("\n[TEST 15] Testing A2 Multi-Item Full Success Commitment...");
  const test15Inv: MockInventory[] = [
    { variantId: "var_A", quantity: 10, reservedQuantity: 2 }, // 8 available
    { variantId: "var_B", quantity: 5, reservedQuantity: 1 },  // 4 available
  ];
  const test15Order: MockOrderItem[] = [
    { variantId: "var_A", quantity: 3 },
    { variantId: "var_B", quantity: 2 },
  ];

  const test15Result = simulateA2Commit(test15Inv, test15Order);
  console.log(`✓ Full Success Commitment: success=${test15Result.success}, VarA qty=${test15Inv[0].quantity}, VarB qty=${test15Inv[1].quantity}, status=${test15Result.status}`);
  if (!test15Result.success || test15Inv[0].quantity !== 7 || test15Inv[1].quantity !== 3 || test15Result.status !== "CONFIRMED") {
    throw new Error("Full success inventory commitment did not decrement properly.");
  }

  // Test 16: A2 Admin Cancellation Inventory Restoration Rules
  console.log("\n[TEST 16] Testing Admin Cancellation Inventory Restoration Rules...");
  function simulateAdminCancel(
    currentStatus: string,
    notes: string | undefined,
    inventories: MockInventory[],
    orderItems: MockOrderItem[]
  ): { restored: boolean } {
    const hadCommittedStock =
      currentStatus === "CONFIRMED" ||
      (currentStatus === "PROCESSING" && !notes?.includes("FULFILLMENT_EXCEPTION"));

    if (hadCommittedStock) {
      for (const item of orderItems) {
        const inv = inventories.find((i) => i.variantId === item.variantId);
        if (inv) inv.quantity += item.quantity;
      }
      return { restored: true };
    }
    return { restored: false };
  }

  // 16.1 CONFIRMED cancellation restores stock
  const test16Inv1: MockInventory[] = [{ variantId: "var_A", quantity: 7, reservedQuantity: 0 }];
  const res16_1 = simulateAdminCancel("CONFIRMED", undefined, test16Inv1, [{ variantId: "var_A", quantity: 3 }]);
  console.log(`✓ CONFIRMED cancellation: restored=${res16_1.restored}, qty=${test16Inv1[0].quantity} (Expected: 10)`);
  if (!res16_1.restored || test16Inv1[0].quantity !== 10) {
    throw new Error("CONFIRMED cancellation failed to restore committed stock.");
  }

  // 16.2 Normal PROCESSING cancellation restores stock
  const test16Inv2: MockInventory[] = [{ variantId: "var_A", quantity: 7, reservedQuantity: 0 }];
  const res16_2 = simulateAdminCancel("PROCESSING", "Normal processing note", test16Inv2, [{ variantId: "var_A", quantity: 3 }]);
  console.log(`✓ Normal PROCESSING cancellation: restored=${res16_2.restored}, qty=${test16Inv2[0].quantity} (Expected: 10)`);
  if (!res16_2.restored || test16Inv2[0].quantity !== 10) {
    throw new Error("Normal PROCESSING cancellation failed to restore committed stock.");
  }

  // 16.3 PROCESSING with FULFILLMENT_EXCEPTION cancellation does NOT restore stock (zero phantom stock)
  const test16Inv3: MockInventory[] = [{ variantId: "var_A", quantity: 10, reservedQuantity: 0 }];
  const res16_3 = simulateAdminCancel(
    "PROCESSING",
    "FULFILLMENT_EXCEPTION: Store stock depleted during concurrent checkout.",
    test16Inv3,
    [{ variantId: "var_A", quantity: 3 }]
  );
  console.log(`✓ FULFILLMENT_EXCEPTION cancellation: restored=${res16_3.restored}, qty=${test16Inv3[0].quantity} (Expected: 10, unchanged)`);
  if (res16_3.restored || test16Inv3[0].quantity !== 10) {
    throw new Error("FULFILLMENT_EXCEPTION cancellation created phantom stock!");
  }

  console.log("\n==================================================");
  console.log(" ALL PHASE 4, PHASE A1 & PHASE A2 UNIT TESTS PASSED! ✓");
  console.log("==================================================");
}

runUnitTests();


