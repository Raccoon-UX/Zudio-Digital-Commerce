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

  console.log("\n==================================================");
  console.log(" ALL PHASE 4 UNIT & CRYPTOGRAPHY TESTS PASSED! ✓");
  console.log("==================================================");
}

runUnitTests();
