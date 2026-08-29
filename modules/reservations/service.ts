import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { ReservationDTO, CreateReservationInput, ReservationStatusType } from "./types";
import { buildDirectionsUrl } from "../stores/service";

function generateReservationNumber(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `RES-${date}-${rand}`;
}

function generatePickupCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "ZUD-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateGuestToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function createReservation(
  input: CreateReservationInput,
  userId?: string | null
): Promise<ReservationDTO> {
  const { storeId, variantId, quantity = 1, guestName, guestEmail, guestPhone, notes } = input;

  if (quantity <= 0 || quantity > 5) {
    throw new AppError("Reservation quantity must be between 1 and 5.", "INVALID_REQUEST", 400);
  }

  // 1. Verify Store exists and is active
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });
  if (!store || !store.isActive) {
    throw new AppError("Store is not active or does not exist.", "INVALID_REQUEST", 404);
  }

  // 2. Verify Product Variant exists
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || !variant.isActive || !variant.product.isActive) {
    throw new AppError("Product variant is unavailable.", "INVALID_REQUEST", 404);
  }

  // Customer identification
  let finalUserId: string | null = null;
  let finalGuestName: string | null = null;
  let finalGuestEmail: string | null = null;
  let finalGuestPhone: string | null = null;
  let guestToken: string | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("Authenticated user not found.", "UNAUTHORIZED", 401);
    finalUserId = user.id;
    finalGuestName = user.name;
    finalGuestEmail = user.email;
    finalGuestPhone = user.phone;
  } else {
    if (!guestName || !guestPhone) {
      throw new AppError("Name and contact phone number are required for in-store reservation.", "INVALID_REQUEST", 400);
    }
    finalGuestName = guestName.trim();
    finalGuestEmail = guestEmail ? guestEmail.trim().toLowerCase() : null;
    finalGuestPhone = guestPhone.trim();
    guestToken = generateGuestToken();
  }

  const reservationNumber = generateReservationNumber();
  const pickupCode = generatePickupCode();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours hold

  // 3. Atomic Prisma Transaction: Verify stock & increment reservedQuantity
  const createdReservation = await prisma.$transaction(async (tx) => {
    // Fetch inventory record
    const inventory = await tx.inventory.findUnique({
      where: {
        storeId_variantId: {
          storeId,
          variantId,
        },
      },
    });

    if (!inventory) {
      throw new AppError("This product variant is not stocked at the selected store.", "OUT_OF_STOCK", 400);
    }

    const availableQuantity = inventory.quantity - inventory.reservedQuantity;
    if (availableQuantity < quantity) {
      throw new AppError(
        `Insufficient stock at ${store.name}. Only ${Math.max(0, availableQuantity)} available for reservation.`,
        "OUT_OF_STOCK",
        400
      );
    }

    // Atomic increment of reservedQuantity
    await tx.inventory.update({
      where: {
        storeId_variantId: {
          storeId,
          variantId,
        },
      },
      data: {
        reservedQuantity: { increment: quantity },
      },
    });

    // Create reservation record
    const res = await tx.reservation.create({
      data: {
        reservationNumber,
        pickupCode,
        guestToken,
        userId: finalUserId,
        guestName: finalGuestName,
        guestEmail: finalGuestEmail,
        guestPhone: finalGuestPhone,
        storeId,
        variantId,
        quantity,
        status: "CONFIRMED",
        expiresAt,
        notes: notes ? notes.trim() : null,
      },
      include: {
        store: true,
        variant: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
              },
            },
            size: true,
            color: true,
          },
        },
      },
    });

    return res;
  });

  return mapReservationToDTO(createdReservation);
}

/**
 * Lazy Expiration Checker:
 * If an active reservation's expiresAt timestamp has passed, atomically marks it EXPIRED and releases reserved stock.
 */
export async function checkAndApplyLazyExpiration(reservationId: string): Promise<boolean> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) return false;

  const now = new Date();
  if (
    reservation.expiresAt < now &&
    (reservation.status === "CONFIRMED" || reservation.status === "READY_FOR_PICKUP" || reservation.status === "PENDING")
  ) {
    await prisma.$transaction(async (tx) => {
      // Conditional transition
      const updateResult = await tx.reservation.updateMany({
        where: {
          id: reservation.id,
          status: { in: ["CONFIRMED", "READY_FOR_PICKUP", "PENDING"] },
        },
        data: {
          status: "EXPIRED",
        },
      });

      if (updateResult.count === 1) {
        // Winning transition releases reservedQuantity
        await tx.inventory.update({
          where: {
            storeId_variantId: {
              storeId: reservation.storeId,
              variantId: reservation.variantId,
            },
          },
          data: {
            reservedQuantity: { decrement: reservation.quantity },
          },
        });
      }
    });
    return true;
  }

  return false;
}

export async function getReservationByIdOrCode(
  idOrCode: string,
  userId?: string | null,
  guestToken?: string | null,
  staffUser?: { role: string; storeId?: string | null } | null
): Promise<ReservationDTO | null> {
  const isCuid = idOrCode.startsWith("c") && idOrCode.length > 20;

  const reservation = await prisma.reservation.findFirst({
    where: {
      OR: [
        ...(isCuid ? [{ id: idOrCode }] : []),
        { reservationNumber: idOrCode },
        { pickupCode: idOrCode },
      ],
    },
    include: {
      store: true,
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
          size: true,
          color: true,
        },
      },
    },
  });

  if (!reservation) return null;

  // Apply lazy expiration check before returning
  await checkAndApplyLazyExpiration(reservation.id);

  // Reload fresh status if lazy expired
  const fresh = await prisma.reservation.findUnique({
    where: { id: reservation.id },
    include: {
      store: true,
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
          size: true,
          color: true,
        },
      },
    },
  });

  if (!fresh) return null;

  // Authorization checks
  if (staffUser) {
    if (staffUser.role === "ADMIN") {
      return mapReservationToDTO(fresh);
    }
    if (staffUser.role === "STORE_STAFF" && staffUser.storeId === fresh.storeId) {
      return mapReservationToDTO(fresh);
    }
    throw new AppError("Staff access denied: Reservation belongs to another store.", "FORBIDDEN", 403);
  }

  // Strict IDOR Authorization
  if (fresh.userId !== null) {
    if (userId && fresh.userId === userId) {
      return mapReservationToDTO(fresh);
    }
    throw new AppError("Access denied. You do not own this reservation.", "FORBIDDEN", 403);
  } else {
    // Guest Reservation: Require valid guestToken
    if (guestToken && fresh.guestToken === guestToken) {
      return mapReservationToDTO(fresh);
    }
    throw new AppError("Access denied. Valid guest reservation token required.", "FORBIDDEN", 403);
  }
}

export async function getUserReservations(userId: string): Promise<ReservationDTO[]> {
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: {
      store: true,
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
          size: true,
          color: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Apply lazy checks on active ones
  for (const r of reservations) {
    if (r.status === "CONFIRMED" || r.status === "READY_FOR_PICKUP") {
      await checkAndApplyLazyExpiration(r.id);
    }
  }

  // Fetch updated list
  const fresh = await prisma.reservation.findMany({
    where: { userId },
    include: {
      store: true,
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
          size: true,
          color: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return fresh.map(mapReservationToDTO);
}

export async function cancelReservation(
  reservationId: string,
  sessionUser?: { id: string; role: string; storeId?: string | null } | null,
  guestToken?: string | null
): Promise<ReservationDTO> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    throw new AppError("Reservation not found.", "INVALID_REQUEST", 404);
  }

  // 1. Authorization check
  const isStaff = sessionUser && (sessionUser.role === "ADMIN" || (sessionUser.role === "STORE_STAFF" && sessionUser.storeId === reservation.storeId));
  const isOwner = sessionUser && reservation.userId === sessionUser.id;
  const isGuestOwner = guestToken && reservation.guestToken === guestToken;

  if (!isStaff && !isOwner && !isGuestOwner) {
    throw new AppError("You are not authorized to cancel this reservation.", "FORBIDDEN", 403);
  }

  // 2. State machine check: only CONFIRMED or READY_FOR_PICKUP can be cancelled
  if (reservation.status !== "CONFIRMED" && reservation.status !== "READY_FOR_PICKUP" && reservation.status !== "PENDING") {
    throw new AppError(
      `Cannot cancel reservation in terminal status '${reservation.status}'.`,
      "INVALID_STATE",
      400
    );
  }

  // 3. Atomic conditional cancellation & inventory release
  await prisma.$transaction(async (tx) => {
    const updateResult = await tx.reservation.updateMany({
      where: {
        id: reservation.id,
        status: { in: ["CONFIRMED", "READY_FOR_PICKUP", "PENDING"] },
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (updateResult.count === 0) {
      throw new AppError("Reservation was already modified by a concurrent process.", "CONCURRENCY_ERROR", 409);
    }

    // Release reserved quantity
    await tx.inventory.update({
      where: {
        storeId_variantId: {
          storeId: reservation.storeId,
          variantId: reservation.variantId,
        },
      },
      data: {
        reservedQuantity: { decrement: reservation.quantity },
      },
    });
  });

  const updated = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      store: true,
      variant: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
          size: true,
          color: true,
        },
      },
    },
  });

  return mapReservationToDTO(updated!);
}

export async function updateReservationStatusByStaff(
  reservationId: string,
  targetStatus: "READY_FOR_PICKUP" | "COLLECTED" | "CANCELLED",
  staffUser: { id: string; role: string; storeId?: string | null }
): Promise<ReservationDTO> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    throw new AppError("Reservation not found.", "INVALID_REQUEST", 404);
  }

  // 1. Staff Store Authorization
  if (staffUser.role !== "ADMIN") {
    if (staffUser.role !== "STORE_STAFF" || staffUser.storeId !== reservation.storeId) {
      throw new AppError("Staff access denied: You can only manage reservations for your assigned store.", "FORBIDDEN", 403);
    }
  }

  // Check lazy expiration first
  await checkAndApplyLazyExpiration(reservation.id);
  const current = await prisma.reservation.findUnique({ where: { id: reservation.id } });
  if (!current) throw new AppError("Reservation not found.", "INVALID_REQUEST", 404);

  // 2. Strict State Machine Transition Rules
  // Allowed:
  // CONFIRMED -> READY_FOR_PICKUP
  // CONFIRMED -> CANCELLED
  // READY_FOR_PICKUP -> COLLECTED
  // READY_FOR_PICKUP -> CANCELLED
  if (targetStatus === "READY_FOR_PICKUP") {
    if (current.status !== "CONFIRMED" && current.status !== "PENDING") {
      throw new AppError(`Cannot mark READY_FOR_PICKUP from '${current.status}'.`, "INVALID_STATE", 400);
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "READY_FOR_PICKUP" },
    });
  } else if (targetStatus === "COLLECTED") {
    if (current.status !== "READY_FOR_PICKUP") {
      throw new AppError(`Cannot collect reservation from status '${current.status}'. Must be marked READY_FOR_PICKUP first.`, "INVALID_STATE", 400);
    }

    // Atomic Handover: Decrement quantity AND reservedQuantity
    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.reservation.updateMany({
        where: {
          id: reservationId,
          status: "READY_FOR_PICKUP",
        },
        data: {
          status: "COLLECTED",
          collectedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new AppError("Reservation was already collected or modified concurrently.", "CONCURRENCY_ERROR", 409);
      }

      await tx.inventory.update({
        where: {
          storeId_variantId: {
            storeId: current.storeId,
            variantId: current.variantId,
          },
        },
        data: {
          quantity: { decrement: current.quantity },
          reservedQuantity: { decrement: current.quantity },
        },
      });
    });
  } else if (targetStatus === "CANCELLED") {
    await cancelReservation(reservationId, staffUser);
  }

  const updated = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      store: true,
      variant: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
          size: true,
          color: true,
        },
      },
    },
  });

  return mapReservationToDTO(updated!);
}

export async function getStoreStaffReservations(
  staffUser: { id: string; role: string; storeId?: string | null },
  filterStoreId?: string,
  statusFilter?: string
): Promise<ReservationDTO[]> {
  let targetStoreId: string | undefined = undefined;

  if (staffUser.role === "ADMIN") {
    targetStoreId = filterStoreId;
  } else if (staffUser.role === "STORE_STAFF") {
    if (!staffUser.storeId) {
      throw new AppError("Staff account has no assigned store.", "FORBIDDEN", 403);
    }
    targetStoreId = staffUser.storeId;
  } else {
    throw new AppError("Unauthorized. Staff role required.", "FORBIDDEN", 403);
  }

  const where: any = {};
  if (targetStoreId) where.storeId = targetStoreId;
  if (statusFilter && statusFilter !== "ALL") where.status = statusFilter;

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      store: true,
      variant: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
          size: true,
          color: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Lazy check active ones
  for (const r of reservations) {
    if (r.status === "CONFIRMED" || r.status === "READY_FOR_PICKUP") {
      await checkAndApplyLazyExpiration(r.id);
    }
  }

  const fresh = await prisma.reservation.findMany({
    where,
    include: {
      store: true,
      variant: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
          size: true,
          color: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return fresh.map(mapReservationToDTO);
}

export async function sweepExpiredReservations(): Promise<{ sweptCount: number }> {
  const now = new Date();
  const expired = await prisma.reservation.findMany({
    where: {
      expiresAt: { lt: now },
      status: { in: ["CONFIRMED", "READY_FOR_PICKUP", "PENDING"] },
    },
  });

  let sweptCount = 0;
  for (const res of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        const updateResult = await tx.reservation.updateMany({
          where: {
            id: res.id,
            status: { in: ["CONFIRMED", "READY_FOR_PICKUP", "PENDING"] },
          },
          data: {
            status: "EXPIRED",
          },
        });

        if (updateResult.count === 1) {
          await tx.inventory.update({
            where: {
              storeId_variantId: {
                storeId: res.storeId,
                variantId: res.variantId,
              },
            },
            data: {
              reservedQuantity: { decrement: res.quantity },
            },
          });
          sweptCount++;
        }
      });
    } catch (err) {
      console.error(`Failed to sweep expired reservation ${res.id}:`, err);
    }
  }

  return { sweptCount };
}

function mapReservationToDTO(r: any): ReservationDTO {
  const now = Date.now();
  const expireTime = new Date(r.expiresAt).getTime();
  const remainingSeconds = Math.max(0, Math.floor((expireTime - now) / 1000));
  const isExpired = r.status === "EXPIRED" || (remainingSeconds === 0 && r.status !== "COLLECTED");

  return {
    id: r.id,
    reservationNumber: r.reservationNumber,
    pickupCode: r.pickupCode || r.reservationNumber.slice(-6),
    guestToken: r.guestToken,
    userId: r.userId,
    customerName: r.guestName || "Valued Customer",
    customerEmail: r.guestEmail,
    customerPhone: r.guestPhone,
    store: {
      id: r.store.id,
      name: r.store.name,
      slug: r.store.slug,
      address: r.store.address,
      city: r.store.city,
      state: r.store.state,
      pincode: r.store.pincode,
      phone: r.store.phone,
      openingHours: r.store.openingHours,
      latitude: r.store.latitude,
      longitude: r.store.longitude,
      directionsUrl: buildDirectionsUrl(r.store.latitude, r.store.longitude, r.store.address),
    },
    product: {
      id: r.variant.product.id,
      name: r.variant.product.name,
      slug: r.variant.product.slug,
      imageUrl: r.variant.product.images[0]?.url || "https://placehold.co/400x533/f5f5f5/333333.png?text=Zudio",
      variantId: r.variant.id,
      sku: r.variant.sku,
      sizeName: r.variant.size.name,
      colorName: r.variant.color.name,
      colorHex: r.variant.color.hexCode,
      price: Number(r.variant.price),
    },
    quantity: r.quantity,
    status: (isExpired && r.status !== "COLLECTED" && r.status !== "CANCELLED" ? "EXPIRED" : r.status) as ReservationStatusType,
    expiresAt: r.expiresAt.toISOString(),
    collectedAt: r.collectedAt ? r.collectedAt.toISOString() : null,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    isExpired,
    remainingSeconds,
  };
}
