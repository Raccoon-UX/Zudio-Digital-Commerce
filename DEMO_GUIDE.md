# Zudio Digital Commerce (Concept Pilot) — Live Demonstration Playbook

A structured, end-to-end presentation walkthrough for showcasing the **Zudio Digital Commerce — Concept Pilot** architecture to executive stakeholders, product teams, and engineering evaluators.

---

## 1. Demo Roles & Pre-configured Credentials

| Role | Account Email | Default Password (Demo) | Primary Capabilities |
|---|---|---|---|
| **Executive Admin** | `admin@zudio.demo` | `Admin@12345` | Real-time KPI Dashboard, Store Inventory Matrix, Order Fulfillment progression, User Role Promotion, Audit Logs. |
| **Store Staff (POS)** | `staff.blr@zudio.demo` | `Staff@12345` | Scoped to **Zudio Indiranagar (Bengaluru)**. Pickup pass lookup, "Mark Ready", "Complete Handover" stock consumption. |
| **Online Customer** | `customer@zudio.demo` | `Customer@12345` | Catalog browsing, dual-mode cart, wishlist, checkout, live order tracking, 2-hour store reservation hold passes. |
| **Guest Shopper** | *(No Login)* | *(No Password)* | Session-based cart, guest checkout with cryptographic token, anonymous store availability checks. |

---

## 2. Live Demo Script (4 Key Scenarios)

### Scenario A: The Modern Omnichannel Shopper Journey (10 Minutes)
1. **Catalog Exploration:**
   - Navigate to `/products`.
   - Filter by Men / Women / Footwear, faceted sizes, and ₹0–₹999 price points.
   - Click a hero product (e.g. *Classic Oxford Button-Down Shirt*).
2. **Real-time Demo Store Stock Lookup:**
   - On the product detail page, click **"Check Demo Store Stock"**.
   - View live availability across 6 flagship stores (Bengaluru, Mumbai, Delhi, Hyderabad, Pune, Chennai).
3. **2-Hour In-Store Reservation Hold:**
   - Select size **L**, choose **Zudio Indiranagar (Bengaluru)**, and click **"Reserve for Store Pickup"**.
   - Immediate confirmation: Real-time pickup pass generated with pickup code (e.g. `ZUD-8F2Q`) and a live **2-hour countdown timer**.
   - Stock invariant check: Store's `reservedQuantity` increments by 1; available units decrease by 1.

---

### Scenario B: Store Associate POS Handover (5 Minutes)
1. **Store Staff Authentication:**
   - Sign in as `staff.blr@zudio.demo`.
   - Navigate to `/staff/reservations`.
2. **Pickup Code Verification:**
   - Search the customer's pickup code `ZUD-8F2Q`.
   - Click **"Mark Ready for Pickup"** (transitions state from `CONFIRMED` $\rightarrow$ `READY_FOR_PICKUP`).
3. **Customer Pickup & Stock Deduction:**
   - Customer arrives at billing counter; staff clicks **"Complete Handover"**.
   - Reservation transitions to terminal state **`COLLECTED`**.
   - Physical store inventory and reserved quantity decrement atomically in PostgreSQL.

---

### Scenario C: Online Commerce & Razorpay Checkout (5 Minutes)
1. **Dual-Mode Cart & Merging:**
   - As a guest, add 2 items to the bag.
   - Click **Sign In** (`customer@zudio.demo`).
   - Notice the anonymous cart items automatically merge into the customer's persistent user cart.
2. **Single-Store Fulfillment Allocation:**
   - Proceed to `/checkout`. Enter shipping address in Bengaluru.
   - Server automatically selects `Zudio Indiranagar (Bengaluru)` with 100% item availability.
3. **Razorpay Payment Initialization & Verification:**
   - Click **"Pay with Razorpay"**.
   - Razorpay gateway modal launches in Sandbox Test Mode.
   - Complete payment: Server verifies cryptographic HMAC SHA-256 signature, commits store stock, and transitions Order to **`CONFIRMED`**.

---

### Scenario D: Executive Operations & Admin Control (5 Minutes)
1. **Executive KPI Dashboard:**
   - Sign in as `admin@zudio.demo` and navigate to `/admin`.
   - Inspect **Gross Paid Revenue** ($\sum \text{Order.total}$ for `Payment.status = PAID`).
   - Review live distribution: Paid orders, active 2-hour holds, low stock alerts.
2. **Store Inventory Matrix Management:**
   - Navigate to `/admin/inventory`.
   - Filter by store; inspect physical vs reserved vs available quantities.
   - Test invariant protection: Attempt to adjust physical stock below active reserved holds — observe instant rejection (`quantity >= reservedQuantity`).
3. **Order Fulfillment Progression:**
   - Navigate to `/admin/orders`.
   - Advance online orders through the state machine: `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`.
4. **Append-Only Audit Log:**
   - Navigate to `/admin/audit-logs`.
   - Inspect recorded mutations with JSON diff details.

---

## 3. Architecture & Security Highlights to Emphasize

- **PostgreSQL as Single Source of Truth:** No in-memory fallback; ACID transactions guarantee 100% data consistency.
- **Cryptographic Payment Integrity:** Strict HMAC SHA-256 verification without bypasses.
- **Anti-Overselling Concurrency:** Atomic conditional operations protect physical stock and reservation holds from race conditions.
- **Strict Role-Based Access Control (RBAC):** Server-side guards on all `/api/admin/*` and store staff endpoints with full IDOR protection.
