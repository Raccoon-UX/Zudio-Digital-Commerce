import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";

export interface ItemToFulfill {
  variantId: string;
  quantity: number;
}

export interface AllocatedStoreResult {
  storeId: string;
  storeName: string;
  city: string;
}

/**
 * Allocate a single active fulfillment store that has full inventory stock for all order items.
 * Prioritizes stores in the customer's delivery city, falling back to any active store with complete stock.
 */
export async function allocateFulfillmentStore(
  items: ItemToFulfill[],
  deliveryCity?: string
): Promise<AllocatedStoreResult> {
  if (items.length === 0) {
    throw new AppError("Cannot allocate fulfillment store for empty items list.", "INVALID_REQUEST", 400);
  }

  // Fetch all active stores with their inventories for the requested variants
  const variantIds = items.map((i) => i.variantId);

  const activeStores = await prisma.store.findMany({
    where: { isActive: true },
    include: {
      inventories: {
        where: { variantId: { in: variantIds } },
      },
    },
    orderBy: { name: "asc" },
  });

  if (activeStores.length === 0) {
    throw new AppError("No active retail stores found in network.", "INTERNAL_SERVER_ERROR", 500);
  }

  // Sort candidate stores: prioritize deliveryCity matches
  const sortedStores = [...activeStores].sort((a, b) => {
    if (deliveryCity) {
      const aMatches = a.city.toLowerCase() === deliveryCity.toLowerCase();
      const bMatches = b.city.toLowerCase() === deliveryCity.toLowerCase();
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
    }
    return 0;
  });

  // Find first store that can fulfill ALL items
  for (const store of sortedStores) {
    let canFulfillAll = true;

    for (const item of items) {
      const inv = store.inventories.find((i) => i.variantId === item.variantId);
      const available = inv ? Math.max(0, inv.quantity - inv.reservedQuantity) : 0;

      if (available < item.quantity) {
        canFulfillAll = false;
        break;
      }
    }

    if (canFulfillAll) {
      return {
        storeId: store.id,
        storeName: store.name,
        city: store.city,
      };
    }
  }

  // If no single store has full stock for all line items
  throw new AppError(
    "Insufficient store inventory to fulfill all requested items in a single shipment.",
    "OUT_OF_STOCK",
    400
  );
}
