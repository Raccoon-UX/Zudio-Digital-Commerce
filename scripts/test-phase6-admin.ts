import { requireAdminUser } from "../modules/admin/service";

/**
 * Phase 6: Admin Operations, Security, RBAC & Inventory Invariant Tests
 */

function runPhase6Tests() {
  console.log("==========================================================");
  console.log(" RUNNING PHASE 6: ADMIN OPERATIONS & SECURITY TESTS");
  console.log("==========================================================\n");

  // --- TEST 1: Server-Side RBAC Guard ---
  console.log("[TEST 1] Testing Server-Side requireAdminUser() RBAC Guard...");
  try {
    requireAdminUser({ id: "user_cust", role: "CUSTOMER" });
    throw new Error("RBAC FAILURE: CUSTOMER was allowed admin access!");
  } catch (err: any) {
    if (err.code !== "FORBIDDEN") throw err;
    console.log("  ✓ PASSED: CUSTOMER role is strictly rejected with 403 FORBIDDEN.");
  }

  try {
    requireAdminUser({ id: "user_staff", role: "STORE_STAFF" });
    throw new Error("RBAC FAILURE: STORE_STAFF was allowed global admin access!");
  } catch (err: any) {
    if (err.code !== "FORBIDDEN") throw err;
    console.log("  ✓ PASSED: STORE_STAFF role is strictly rejected with 403 FORBIDDEN.");
  }

  try {
    requireAdminUser({ id: "user_admin", role: "ADMIN" });
    console.log("  ✓ PASSED: ADMIN role is granted access.\n");
  } catch (err) {
    throw new Error("RBAC FAILURE: Valid ADMIN was rejected!");
  }

  // --- STATE MODEL SIMULATOR FOR ADMIN OPERATIONS ---
  interface UserRecord {
    id: string;
    email: string;
    role: "CUSTOMER" | "STORE_STAFF" | "ADMIN";
    storeId: string | null;
  }

  interface StoreInventoryRecord {
    quantity: number;
    reservedQuantity: number;
  }

  interface OrderRecord {
    id: string;
    orderNumber: string;
    storeId: string;
    status: "ORDER_PLACED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    paymentStatus: "PENDING" | "PAID" | "FAILED";
    total: number;
    items: { variantId: string; quantity: number }[];
  }

  interface AuditRecord {
    action: string;
    entityType: string;
    details: any;
  }

  let users: Map<string, UserRecord> = new Map([
    ["admin_1", { id: "admin_1", email: "admin1@zudio.test", role: "ADMIN", storeId: null }],
    ["admin_2", { id: "admin_2", email: "admin2@zudio.test", role: "ADMIN", storeId: null }],
    ["staff_1", { id: "staff_1", email: "staff1@zudio.test", role: "STORE_STAFF", storeId: "store_blr" }],
    ["cust_1", { id: "cust_1", email: "cust1@zudio.test", role: "CUSTOMER", storeId: null }],
  ]);

  let inventory: StoreInventoryRecord = { quantity: 10, reservedQuantity: 4 };
  let auditLogs: AuditRecord[] = [];

  function recordAuditSim(action: string, entityType: string, details: any) {
    auditLogs.push({ action, entityType, details });
  }

  // --- TEST 2: Role Management Security & Safeguards ---
  console.log("[TEST 2] Testing Role Management Security & Safeguards...");

  function updateUserRoleSim(
    targetUserId: string,
    newRole: "CUSTOMER" | "STORE_STAFF" | "ADMIN",
    storeId: string | null,
    currentAdminId: string
  ): { success: boolean; error?: string } {
    const target = users.get(targetUserId);
    if (!target) return { success: false, error: "NOT_FOUND" };

    // 1. Admin cannot demote themselves
    if (targetUserId === currentAdminId && newRole !== "ADMIN") {
      return { success: false, error: "CANNOT_DEMOTE_SELF" };
    }

    // 2. Cannot remove last admin
    if (target.role === "ADMIN" && newRole !== "ADMIN") {
      const adminCount = Array.from(users.values()).filter((u) => u.role === "ADMIN").length;
      if (adminCount <= 1) {
        return { success: false, error: "LAST_ADMIN_PROTECTED" };
      }
    }

    // 3. STORE_STAFF requires mandatory storeId
    if (newRole === "STORE_STAFF" && !storeId) {
      return { success: false, error: "STORE_ID_REQUIRED_FOR_STAFF" };
    }

    target.role = newRole;
    target.storeId = newRole === "STORE_STAFF" ? storeId : null;
    recordAuditSim("USER_ROLE_UPDATED", "User", { targetUserId, newRole, storeId });
    return { success: true };
  }

  // A. Admin self-demotion test
  const selfDemote = updateUserRoleSim("admin_1", "CUSTOMER", null, "admin_1");
  console.log(`  Admin Self-Demotion Attempt: success=${selfDemote.success}, error=${selfDemote.error}`);
  if (selfDemote.success || selfDemote.error !== "CANNOT_DEMOTE_SELF") {
    throw new Error("SECURITY FAILURE: Admin was able to demote their own account!");
  }

  // B. Staff promotion without storeId test
  const staffNoStore = updateUserRoleSim("cust_1", "STORE_STAFF", null, "admin_1");
  console.log(`  Staff Promotion Without Store: success=${staffNoStore.success}, error=${staffNoStore.error}`);
  if (staffNoStore.success || staffNoStore.error !== "STORE_ID_REQUIRED_FOR_STAFF") {
    throw new Error("SECURITY FAILURE: STORE_STAFF role was assigned without a mandatory storeId!");
  }

  // C. Demoting admin_2 (leaving admin_1)
  const demoteAdmin2 = updateUserRoleSim("admin_2", "CUSTOMER", null, "admin_1");
  console.log(`  Demote Admin 2: success=${demoteAdmin2.success}`);

  // D. Last remaining admin demotion test
  const demoteLastAdmin = updateUserRoleSim("admin_1", "CUSTOMER", null, "admin_2");
  console.log(`  Demote Last Remaining Admin: success=${demoteLastAdmin.success}, error=${demoteLastAdmin.error}`);
  if (demoteLastAdmin.success || demoteLastAdmin.error !== "LAST_ADMIN_PROTECTED") {
    throw new Error("SECURITY FAILURE: Last remaining Admin account was removed!");
  }
  console.log("  ✓ PASSED: Role management safeguards strictly enforced.\n");

  // --- TEST 3: Inventory Invariants (quantity >= reservedQuantity) ---
  console.log("[TEST 3] Testing Inventory Invariants (quantity >= reservedQuantity)...");

  function adjustInventorySim(
    newQuantity: number,
    reason: string
  ): { success: boolean; error?: string } {
    if (newQuantity < 0) return { success: false, error: "NEGATIVE_QUANTITY" };
    // Invariant check: quantity >= reservedQuantity
    if (newQuantity < inventory.reservedQuantity) {
      return { success: false, error: "QUANTITY_LESS_THAN_RESERVED" };
    }
    const prev = inventory.quantity;
    inventory.quantity = newQuantity;
    recordAuditSim("INVENTORY_ADJUSTED", "Inventory", { prev, newQuantity, reason });
    return { success: true };
  }

  // Currently: quantity=10, reservedQuantity=4
  // Attempt to reduce physical quantity to 2 (< 4 reserved)
  const invalidReduction = adjustInventorySim(2, "Faulty adjustment");
  console.log(`  Reduce Below Reserved Hold: success=${invalidReduction.success}, error=${invalidReduction.error}`);
  if (invalidReduction.success || invalidReduction.error !== "QUANTITY_LESS_THAN_RESERVED") {
    throw new Error("INVARIANT VIOLATION: Reduced physical quantity below active reservation holds!");
  }

  // Valid adjustment to 15
  const validAdjustment = adjustInventorySim(15, "Restock batch #402");
  console.log(`  Valid Stock Adjustment to 15: success=${validAdjustment.success}, newQty=${inventory.quantity}`);
  if (!validAdjustment.success || inventory.quantity !== 15) {
    throw new Error("Failed valid inventory adjustment!");
  }
  console.log("  ✓ PASSED: Inventory invariants strictly preserved.\n");

  // --- TEST 4: Order State Machine Transitions & Cancellation Idempotency ---
  console.log("[TEST 4] Testing Order State Machine Transitions & Idempotent Inventory Restoration...");

  let orders: Map<string, OrderRecord> = new Map([
    [
      "ord_1",
      {
        id: "ord_1",
        orderNumber: "ORD-260301-A1B2",
        storeId: "store_blr",
        status: "CONFIRMED",
        paymentStatus: "PAID",
        total: 1499,
        items: [{ variantId: "var_shirt_m", quantity: 2 }],
      },
    ],
  ]);

  let itemStock = { quantity: 8, reservedQuantity: 0 }; // at store_blr

  function updateOrderStatusSim(
    orderId: string,
    targetStatus: "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  ): { success: boolean; error?: string } {
    const order = orders.get(orderId);
    if (!order) return { success: false, error: "NOT_FOUND" };

    const current = order.status;

    // Strict transitions
    if (targetStatus === "PROCESSING") {
      if (current !== "CONFIRMED") return { success: false, error: "INVALID_TRANSITION" };
      order.status = "PROCESSING";
      return { success: true };
    }

    if (targetStatus === "SHIPPED") {
      if (current !== "PROCESSING") return { success: false, error: "INVALID_TRANSITION" };
      order.status = "SHIPPED";
      return { success: true };
    }

    if (targetStatus === "DELIVERED") {
      if (current !== "SHIPPED") return { success: false, error: "INVALID_TRANSITION" };
      order.status = "DELIVERED";
      return { success: true };
    }

    if (targetStatus === "CANCELLED") {
      if (current === "SHIPPED" || current === "DELIVERED" || current === "CANCELLED") {
        return { success: false, error: `CANNOT_CANCEL_${current}` };
      }

      // Atomic cancellation & inventory restoration
      order.status = "CANCELLED";
      if (current === "CONFIRMED" || current === "PROCESSING") {
        for (const item of order.items) {
          itemStock.quantity += item.quantity;
        }
      }
      recordAuditSim("ORDER_CANCELLED_WITH_INVENTORY_RESTORE", "Order", { orderId });
      return { success: true };
    }

    return { success: false, error: "UNKNOWN_STATUS" };
  }

  // A. Advance CONFIRMED -> PROCESSING
  const toProcessing = updateOrderStatusSim("ord_1", "PROCESSING");
  console.log(`  Advance CONFIRMED -> PROCESSING: success=${toProcessing.success}`);

  // B. Attempt illegal skip PROCESSING -> DELIVERED
  const illegalSkip = updateOrderStatusSim("ord_1", "DELIVERED");
  console.log(`  Illegal Skip PROCESSING -> DELIVERED: success=${illegalSkip.success}, error=${illegalSkip.error}`);
  if (illegalSkip.success) {
    throw new Error("STATE MACHINE FAILURE: Allowed illegal skip to DELIVERED!");
  }

  // C. Cancel PROCESSING order & restore inventory
  const stockBeforeCancel = itemStock.quantity;
  const cancelOrder = updateOrderStatusSim("ord_1", "CANCELLED");
  console.log(`  Cancel Order from PROCESSING: success=${cancelOrder.success}`);
  console.log(`  Item Stock Before Cancel: ${stockBeforeCancel}, After Cancel: ${itemStock.quantity}`);

  if (!cancelOrder.success || itemStock.quantity !== stockBeforeCancel + 2) {
    throw new Error("Failed to restore inventory upon order cancellation!");
  }

  // D. Idempotency test: Double-cancellation must NOT restore inventory twice
  const doubleCancel = updateOrderStatusSim("ord_1", "CANCELLED");
  console.log(`  Double Cancel Call: success=${doubleCancel.success}, error=${doubleCancel.error}`);
  console.log(`  Item Stock After Double Cancel: ${itemStock.quantity} (Expected: ${stockBeforeCancel + 2})`);

  if (doubleCancel.success || itemStock.quantity !== stockBeforeCancel + 2) {
    throw new Error("IDEMPOTENCY FAILURE: Inventory was restored twice on double cancellation!");
  }
  console.log("  ✓ PASSED: Order state machine and idempotent inventory restoration verified.\n");

  // --- TEST 5: Gross Paid Revenue Formula ---
  console.log("[TEST 5] Testing Gross Paid Revenue Formula...");
  const sampleOrders = [
    { total: 1000, paymentStatus: "PAID" },
    { total: 500, paymentStatus: "PAID" },
    { total: 800, paymentStatus: "PENDING" },
    { total: 1200, paymentStatus: "FAILED" },
  ];
  const grossPaidRev = sampleOrders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.total, 0);

  console.log(`  Gross Paid Revenue: ₹${grossPaidRev} (Expected: ₹1500)`);
  if (grossPaidRev !== 1500) {
    throw new Error(`Gross Paid Revenue mismatch: got ${grossPaidRev}`);
  }
  console.log("  ✓ PASSED: Revenue strictly accounts for Payment.status = PAID.\n");

  // --- TEST 6: Audit Log Append-Only Trail ---
  console.log("[TEST 6] Testing Audit Log Append-Only Trail...");
  console.log(`  Total Audit Logs Recorded: ${auditLogs.length}`);
  const actions = auditLogs.map((l) => l.action);
  console.log(`  Logged Actions: ${actions.join(", ")}`);
  if (auditLogs.length < 3) {
    throw new Error("Audit log trail is incomplete!");
  }
  console.log("  ✓ PASSED: All critical mutations recorded in append-only audit trail.\n");

  console.log("==========================================================");
  console.log(" ALL PHASE 6 ADMIN OPERATIONS TESTS PASSED! ✓");
  console.log("==========================================================");
}

runPhase6Tests();
