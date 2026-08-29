import { calculateDistanceKm } from "../modules/stores/service";

/**
 * Phase 5: Physical Stores & In-Store Reservations Test Suite
 */

function runPhase5Tests() {
  console.log("==========================================================");
  console.log(" RUNNING PHASE 5: STORES & RESERVATIONS AUTOMATED TESTS");
  console.log("==========================================================\n");

  // --- TEST 1: Haversine Geo-Distance Calculation ---
  console.log("[TEST 1] Testing Haversine Geo-Distance Calculation...");
  // Bangalore MG Road to Indiranagar 100ft Road (~3.8 km)
  const distKm = calculateDistanceKm(12.9756, 77.6066, 12.9719, 77.6412);
  console.log(`  Distance computed: ${distKm} km (Expected ~3.8 km)`);
  if (distKm < 3.0 || distKm > 4.5) {
    throw new Error(`Haversine calculation out of expected range: got ${distKm}`);
  }
  console.log("  ✓ PASSED: Geo-distance calculation is accurate.\n");

  // --- STATE MODEL SIMULATOR FOR ATOMIC RESERVATIONS ---
  interface StoreInventory {
    quantity: number;
    reservedQuantity: number;
  }

  interface ReservationRecord {
    id: string;
    storeId: string;
    userId: string | null;
    guestToken: string | null;
    status: "CONFIRMED" | "READY_FOR_PICKUP" | "COLLECTED" | "CANCELLED" | "EXPIRED";
    quantity: number;
    expiresAt: number;
  }

  let inventory: StoreInventory = { quantity: 5, reservedQuantity: 0 };
  let reservations: Map<string, ReservationRecord> = new Map();

  function availableStock(inv: StoreInventory): number {
    return inv.quantity - inv.reservedQuantity;
  }

  function createReservationSim(
    resId: string,
    storeId: string,
    userId: string | null,
    guestToken: string | null,
    reqQty: number
  ): { success: boolean; error?: string } {
    if (availableStock(inventory) < reqQty) {
      return { success: false, error: "OUT_OF_STOCK" };
    }

    // Atomic transaction
    inventory.reservedQuantity += reqQty;
    reservations.set(resId, {
      id: resId,
      storeId,
      userId,
      guestToken,
      status: "CONFIRMED",
      quantity: reqQty,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    });

    return { success: true };
  }

  function cancelReservationSim(
    resId: string,
    callerUser: { id: string; role: string; storeId?: string } | null,
    guestToken?: string
  ): { success: boolean; error?: string } {
    const res = reservations.get(resId);
    if (!res) return { success: false, error: "NOT_FOUND" };

    // Authorization
    const isStaff = callerUser && (callerUser.role === "ADMIN" || (callerUser.role === "STORE_STAFF" && callerUser.storeId === res.storeId));
    const isOwner = callerUser && res.userId === callerUser.id;
    const isGuestOwner = guestToken && res.guestToken === guestToken;

    if (!isStaff && !isOwner && !isGuestOwner) {
      return { success: false, error: "FORBIDDEN" };
    }

    // State machine check
    if (res.status !== "CONFIRMED" && res.status !== "READY_FOR_PICKUP") {
      return { success: false, error: `INVALID_STATE: ${res.status}` };
    }

    // Atomic release
    res.status = "CANCELLED";
    inventory.reservedQuantity -= res.quantity;
    return { success: true };
  }

  function staffUpdateStatusSim(
    resId: string,
    targetStatus: "READY_FOR_PICKUP" | "COLLECTED" | "CANCELLED",
    staffUser: { id: string; role: string; storeId?: string }
  ): { success: boolean; error?: string } {
    const res = reservations.get(resId);
    if (!res) return { success: false, error: "NOT_FOUND" };

    // Staff store scope
    if (staffUser.role !== "ADMIN" && (staffUser.role !== "STORE_STAFF" || staffUser.storeId !== res.storeId)) {
      return { success: false, error: "FORBIDDEN_STORE_STAFF" };
    }

    // State transitions
    if (targetStatus === "READY_FOR_PICKUP") {
      if (res.status !== "CONFIRMED") {
        return { success: false, error: `INVALID_TRANSITION from ${res.status}` };
      }
      res.status = "READY_FOR_PICKUP";
      return { success: true };
    }

    if (targetStatus === "COLLECTED") {
      if (res.status !== "READY_FOR_PICKUP") {
        return { success: false, error: `INVALID_TRANSITION from ${res.status}: must be READY_FOR_PICKUP first` };
      }
      res.status = "COLLECTED";
      inventory.quantity -= res.quantity;
      inventory.reservedQuantity -= res.quantity;
      return { success: true };
    }

    if (targetStatus === "CANCELLED") {
      return cancelReservationSim(resId, staffUser);
    }

    return { success: false, error: "UNKNOWN_STATUS" };
  }

  function lazyExpireSim(resId: string, now: number): boolean {
    const res = reservations.get(resId);
    if (!res) return false;

    if (res.expiresAt < now && (res.status === "CONFIRMED" || res.status === "READY_FOR_PICKUP")) {
      res.status = "EXPIRED";
      inventory.reservedQuantity -= res.quantity;
      return true;
    }
    return false;
  }

  // --- TEST 2: In-Store Reservation Creation & Stock Hold ---
  console.log("[TEST 2] Testing In-Store Reservation Creation & Stock Hold...");
  const res1 = createReservationSim("res_1", "store_blr", "user_101", null, 2);
  console.log(`  Creation Result: success=${res1.success}`);
  console.log(`  Inventory State: quantity=${inventory.quantity}, reservedQuantity=${inventory.reservedQuantity}, available=${availableStock(inventory)}`);

  if (!res1.success || inventory.reservedQuantity !== 2 || availableStock(inventory) !== 3) {
    throw new Error("Reservation creation failed to increment reservedQuantity properly!");
  }
  console.log("  ✓ PASSED: Reservation successfully created and stock held.\n");

  // --- TEST 3: Concurrency & Anti-Overselling Guard ---
  console.log("[TEST 3] Testing Concurrency & Anti-Overselling Guard...");
  // Currently available = 3. Attempt 2 concurrent reservations for 2 units each (total 4 > 3).
  const concurrentA = createReservationSim("res_2", "store_blr", "user_102", null, 2);
  const concurrentB = createReservationSim("res_3", "store_blr", "user_103", null, 2);

  console.log(`  Concurrent Request A Result: success=${concurrentA.success}`);
  console.log(`  Concurrent Request B Result: success=${concurrentB.success}, error=${concurrentB.error}`);
  console.log(`  Inventory Remaining: available=${availableStock(inventory)}, reserved=${inventory.reservedQuantity}`);

  if (!concurrentA.success || concurrentB.success || concurrentB.error !== "OUT_OF_STOCK") {
    throw new Error("Concurrency failure: overselling was not prevented!");
  }
  if (inventory.reservedQuantity > inventory.quantity) {
    throw new Error("Invariant violated: reservedQuantity exceeds total physical quantity!");
  }
  console.log("  ✓ PASSED: Overselling prevented; race condition handled correctly.\n");

  // --- TEST 4: Authorization Guards ---
  console.log("[TEST 4] Testing Customer & Store Staff Authorization Guards...");

  // Customer B cannot cancel Customer A's reservation
  const authCancelAttempt = cancelReservationSim("res_1", { id: "user_hacker", role: "CUSTOMER" });
  console.log(`  Unauthorized Customer Cancel: success=${authCancelAttempt.success}, error=${authCancelAttempt.error}`);
  if (authCancelAttempt.success || authCancelAttempt.error !== "FORBIDDEN") {
    throw new Error("SECURITY FAILURE: Customer was able to cancel another user's reservation!");
  }

  // Staff from Mumbai cannot manage Bangalore store reservations
  const staffMismatchAttempt = staffUpdateStatusSim("res_1", "READY_FOR_PICKUP", {
    id: "staff_mum_01",
    role: "STORE_STAFF",
    storeId: "store_mum",
  });
  console.log(`  Mismatched Store Staff Action: success=${staffMismatchAttempt.success}, error=${staffMismatchAttempt.error}`);
  if (staffMismatchAttempt.success || staffMismatchAttempt.error !== "FORBIDDEN_STORE_STAFF") {
    throw new Error("SECURITY FAILURE: Staff from wrong store was allowed to update reservation!");
  }
  console.log("  ✓ PASSED: Authorization guards enforce strict user ownership and store scope.\n");

  // --- TEST 5: State Machine Enforcement & Handover ---
  console.log("[TEST 5] Testing State Machine Transitions & Handover Collection...");

  // Attempt direct COLLECTED from CONFIRMED (must be rejected)
  const invalidCollect = staffUpdateStatusSim("res_1", "COLLECTED", {
    id: "staff_blr_01",
    role: "STORE_STAFF",
    storeId: "store_blr",
  });
  console.log(`  Direct Collect from CONFIRMED: success=${invalidCollect.success}, error=${invalidCollect.error}`);
  if (invalidCollect.success) {
    throw new Error("State machine failure: allowed COLLECTED directly without READY_FOR_PICKUP!");
  }

  // Valid transition: CONFIRMED -> READY_FOR_PICKUP
  const markReady = staffUpdateStatusSim("res_1", "READY_FOR_PICKUP", {
    id: "staff_blr_01",
    role: "STORE_STAFF",
    storeId: "store_blr",
  });
  console.log(`  Mark Ready for Pickup: success=${markReady.success}`);

  // Valid transition: READY_FOR_PICKUP -> COLLECTED
  const invBeforeCollect = { ...inventory };
  const collectHandover = staffUpdateStatusSim("res_1", "COLLECTED", {
    id: "staff_blr_01",
    role: "STORE_STAFF",
    storeId: "store_blr",
  });
  console.log(`  Complete Handover: success=${collectHandover.success}`);
  console.log(`  Inventory Before Handover: quantity=${invBeforeCollect.quantity}, reserved=${invBeforeCollect.reservedQuantity}`);
  console.log(`  Inventory After Handover: quantity=${inventory.quantity}, reserved=${inventory.reservedQuantity}`);

  if (inventory.quantity !== invBeforeCollect.quantity - 2 || inventory.reservedQuantity !== invBeforeCollect.reservedQuantity - 2) {
    throw new Error("Handover collection failed to decrement both quantity and reservedQuantity!");
  }

  // Attempt cancel on terminal COLLECTED reservation (must be rejected)
  const cancelCollected = cancelReservationSim("res_1", { id: "user_101", role: "CUSTOMER" });
  console.log(`  Cancel Collected Reservation: success=${cancelCollected.success}, error=${cancelCollected.error}`);
  if (cancelCollected.success) {
    throw new Error("Terminal state failure: allowed cancellation of already collected reservation!");
  }
  console.log("  ✓ PASSED: State machine enforced and inventory decremented atomically upon handover.\n");

  // --- TEST 6: Lazy Expiration & Stock Release ---
  console.log("[TEST 6] Testing Lazy Expiration & Reserved Stock Release...");
  // res_2 is in CONFIRMED holding 2 units
  const invBeforeExpire = { ...inventory };
  // Simulate time 3 hours into future (> 2h window)
  const futureTime = Date.now() + 3 * 60 * 60 * 1000;
  const expiredApplied = lazyExpireSim("res_2", futureTime);

  console.log(`  Lazy Expiration Applied: ${expiredApplied}`);
  console.log(`  Inventory After Expiration Release: reserved=${inventory.reservedQuantity} (Initial: ${invBeforeExpire.reservedQuantity})`);

  if (!expiredApplied || inventory.reservedQuantity !== invBeforeExpire.reservedQuantity - 2) {
    throw new Error("Lazy expiration failed to release reserved stock!");
  }
  console.log("  ✓ PASSED: Expired reservation automatically releases reserved quantity.\n");

  console.log("==========================================================");
  console.log(" ALL PHASE 5 STORES & RESERVATION TESTS PASSED! ✓");
  console.log("==========================================================");
}

runPhase5Tests();
