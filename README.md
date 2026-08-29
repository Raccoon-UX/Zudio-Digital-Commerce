# Zudio Digital Commerce — Concept Pilot

> **Unofficial Concept Prototype:** Omnichannel digital commerce architecture for high-velocity, everyday fashion retail.

![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2.35-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Prisma ORM](https://img.shields.io/badge/Prisma-5.22.0-teal?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Razorpay](https://img.shields.io/badge/Razorpay-Sandbox_Ready-02042b?logo=razorpay)

---

## 🌟 Executive Overview

**Zudio Digital Commerce (Concept Pilot)** is an end-to-end modern digital commerce and physical store integration platform designed for the unique dynamics of high-volume, trend-driven fashion retail.

It seamlessly unifies **Online Direct-to-Consumer Shopping** with **Physical Omnichannel Store Presence**, enabling live store inventory visibility, 2-hour in-store holds, store-associate POS handovers, single-store fulfillment routing, and executive operations control.

---

## 🏗️ Architecture & Core System Pillars

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               MODULAR MONOLITH ARCHITECTURE                                      │
├─────────────────────────┬─────────────────────────┬──────────────────────┬───────────────────────┤
│ 🛒 CUSTOMER COMMERCE    │ 🏬 OMNICHANNEL STORES   │ 💳 SECURE PAYMENTS   │ 📊 ADMIN & OPS        │
│ • Faceted Catalog & Sku │ • Store Locator & Maps  │ • Razorpay Gateway   │ • Executive KPI Dash  │
│ • Dual-Mode Cart (Merge)│ • Live Store Stock View │ • Strict HMAC SHA256 │ • Store Stock Matrix  │
│ • Product-Level Wishlist│ • 2-Hour In-Store Holds │ • Single-Store Alloc │ • Order State Machine │
│ • Guest & Auth Checkout │ • Staff POS Handover    │ • Concurrency Guards │ • Append-Only Audits  │
│ • Server Price Authority│ • Lazy Expiration Sweep │ • Zero Test Bypasses │ • Role Management     │
└─────────────────────────┴─────────────────────────┴──────────────────────┴───────────────────────┘
```

### 1. Zero-Trust Security & Cryptographic Payment Integrity
- **HMAC SHA-256 Verification:** Server independently computes and verifies payment signatures against `RAZORPAY_KEY_SECRET`. No client-side bypasses or synthetic verification tokens.
- **Idempotency & Race Protection:** Database-level conditional transitions ensure payment confirmations and webhook events commit inventory and update order status **exactly once**.
- **Anti-Negative Stock Guard:** Atomic `updateMany` conditional updates guarantee physical store inventory never drops below 0. If stock is exhausted by a concurrent order, the paid transaction is preserved in an explicit `FULFILLMENT_EXCEPTION` state with audit alerts.

### 2. Omnichannel In-Store Reservations (2-Hour Holds)
- **Real-Time Store Inventory:** Live visibility across 6 flagship stores (Bengaluru, Mumbai, Delhi, Hyderabad, Pune, Chennai).
- **2-Hour Hold State Machine:** `CONFIRMED` $\rightarrow$ `READY_FOR_PICKUP` $\rightarrow$ `COLLECTED` (or `CANCELLED` / `EXPIRED`).
- **Store Associate POS Portal (`/staff/reservations`):** Real-time pickup pass code lookup, status transition, and atomic stock deduction upon customer handover.

### 3. Strict Role-Based Access Control (RBAC) & IDOR Protection
- **Ownership Verification:** Authenticated orders and reservation hold passes are strictly restricted to the owning `userId` or `ADMIN`.
- **Guest Access:** Secure 32-character hexadecimal `guestToken` required to view guest checkout orders and reservation slips.
- **Store Staff Isolation:** Store associates are strictly scoped to their assigned `storeId` with zero cross-store data leakage.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v20.x` or higher
- **Package Manager:** `npm` (v10+)
- **Database:** PostgreSQL 16+ (Local or Docker)

### 1. Installation & Environment Setup
```bash
# Clone the repository
git clone https://github.com/Raccoon-UX/Zudio-Digital-Commerce.git
cd Zudio-Digital-Commerce

# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

Edit `.env` to configure your PostgreSQL `DATABASE_URL` and NextAuth secret.

### 2. Database Setup & Turnkey Seeding
```bash
# Validate Prisma schema
npx prisma validate

# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Seed demo catalog, 6 stores, and test user accounts
npx prisma db seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo User Accounts

When `DEMO_SEED_ENABLED=true` is set, the following turnkey demo accounts are provisioned:

| Role | Email | Password | Primary Portal / Purpose |
|---|---|---|---|
| **Executive Admin** | `admin@zudio.demo` | `Admin@12345` | `/admin` — KPI revenue, inventory matrix, order progression, audit logs |
| **Store Staff (POS)** | `staff.blr@zudio.demo` | `Staff@12345` | `/staff/reservations` — Bengaluru store pickup verification & handovers |
| **Online Customer** | `customer@zudio.demo` | `Customer@12345` | `/products`, `/cart`, `/checkout`, `/profile`, `/orders` |
| **Guest Shopper** | *(No Account)* | *(No Password)* | Session-based cart, guest checkout, store availability lookup |

> 📖 **Full Live Presentation Script:** See [`DEMO_GUIDE.md`](./DEMO_GUIDE.md) for a step-by-step stakeholder demonstration playbook.

---

## 🧪 Automated Test & Regression Suites

The project features comprehensive end-to-end automated verification suites across all architectural phases:

```bash
# 1. Payment Security & Anti-Tamper Tests
npx tsx scripts/test-phase4-security-regressions.ts

# 2. Stores & 2-Hour Reservation Lifecycle Tests
npx tsx scripts/test-phase5-reservations.ts

# 3. Admin RBAC, State Machine & Role Security Tests
npx tsx scripts/test-phase6-admin.ts

# 4. Full Security & IDOR Regression Tests
npx tsx scripts/audit/test-full-system-security.ts

# 5. Concurrency, Race Condition & Idempotency Tests
npx tsx scripts/audit/test-full-system-concurrency.ts

# 6. Full End-to-End Business Flow Lifecycle Tests
npx tsx scripts/audit/test-e2e-business-flows.ts
```

---

## 🐳 Docker Deployment

The application includes a multi-stage production Dockerfile and Docker Compose stack:

```bash
# Build and launch Next.js standalone container + PostgreSQL 16
docker compose up -d --build
```
Access the application at `http://localhost:3000` and inspect health at `http://localhost:3000/api/health`.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Components, Route Handlers)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Database & ORM:** [PostgreSQL 16](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js (Auth.js)](https://next-auth.js.org/) (JWT Strategy with bcrypt)
- **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Payment Gateway:** [Razorpay Node SDK](https://razorpay.com/) (HMAC SHA-256 Verification)
- **Containerization:** Docker & Docker Compose (Standalone Output)

---

## 📄 License & Disclaimer

This project is an independent concept prototype developed for educational and architectural demonstration purposes. All trademarks and brand names belong to their respective owners.
