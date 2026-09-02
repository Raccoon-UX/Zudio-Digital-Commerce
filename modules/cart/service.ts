import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { CartDTO, CartItemDTO } from "./types";
import { APP_CONFIG } from "@/lib/constants";

export async function getOrCreateCart(userId?: string | null, sessionToken?: string | null) {
  if (userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }
    return cart;
  }

  if (sessionToken) {
    let cart = await prisma.cart.findUnique({
      where: { sessionToken },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionToken },
      });
    }
    return cart;
  }

  throw new AppError("Either userId or sessionToken is required to resolve cart.", "INVALID_REQUEST", 400);
}

export async function getCart(userId?: string | null, sessionToken?: string | null): Promise<CartDTO> {
  try {
    if (!userId && !sessionToken) {
      throw new AppError("Either userId or sessionToken is required to resolve cart.", "INVALID_REQUEST", 400);
    }

    // Single-roundtrip query for cart and nested items
    let cart = await prisma.cart.findUnique({
      where: userId ? { userId } : { sessionToken: sessionToken || "" },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { sortOrder: "asc" } },
                  },
                },
                size: true,
                color: true,
                inventories: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: userId ? { userId } : { sessionToken: sessionToken || "" },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: { orderBy: { sortOrder: "asc" } },
                    },
                  },
                  size: true,
                  color: true,
                  inventories: true,
                },
              },
            },
          },
        },
      });
    }

    const items: CartItemDTO[] = (cart.items || []).map((item) => {
      const v = item.variant;
      const p = v.product;
      const unitPrice = Number(v.price);
      const compareAtPrice = v.compareAtPrice ? Number(v.compareAtPrice) : null;
      const subtotal = unitPrice * item.quantity;

      // Calculate total stock available across all stores
      const totalStock = v.inventories.reduce(
        (sum, inv) => sum + Math.max(0, inv.quantity - inv.reservedQuantity),
        0
      );

      const primaryImg = p.images.find((img) => img.isPrimary) || p.images[0];

      return {
        id: item.id,
        variantId: v.id,
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        sku: v.sku,
        size: v.size.name,
        color: v.color.name,
        colorHex: v.color.hexCode,
        unitPrice,
        compareAtPrice,
        imageUrl: primaryImg?.url || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        quantity: item.quantity,
        subtotal,
        maxAvailableQuantity: totalStock,
        inStock: totalStock > 0,
      };
    });

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    const freeDeliveryThreshold = APP_CONFIG.freeDeliveryThreshold; // 799
    const standardDeliveryFee = APP_CONFIG.deliveryFee; // 49
    const deliveryFee = subtotal === 0 || subtotal >= freeDeliveryThreshold ? 0 : standardDeliveryFee;
    const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    return {
      id: cart.id,
      userId: cart.userId,
      sessionToken: cart.sessionToken,
      items,
      itemCount,
      subtotal,
      deliveryFee,
      freeDeliveryThreshold,
      amountNeededForFreeDelivery,
      discount,
      total,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error retrieving cart:", error);
    throw new AppError("Failed to retrieve shopping cart.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function addToCart(
  variantId: string,
  quantity: number = 1,
  userId?: string | null,
  sessionToken?: string | null
): Promise<CartDTO> {
  try {
    if (quantity < 1) {
      throw new AppError("Quantity must be at least 1.", "INVALID_REQUEST", 400);
    }

    // Verify variant exists and is active
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
        inventories: true,
      },
    });

    if (!variant || !variant.isActive || !variant.product.isActive) {
      throw new AppError("Selected product variant is unavailable.", "VARIANT_NOT_FOUND", 404);
    }

    const totalAvailable = variant.inventories.reduce(
      (sum, inv) => sum + Math.max(0, inv.quantity - inv.reservedQuantity),
      0
    );

    if (totalAvailable <= 0) {
      throw new AppError("Selected size is currently out of stock.", "OUT_OF_STOCK", 400);
    }

    const cart = await getOrCreateCart(userId, sessionToken);

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > 10) {
        throw new AppError("Maximum allowed limit is 10 units per item.", "INVALID_REQUEST", 400);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity: Math.min(quantity, 10),
        },
      });
    }

    return await getCart(userId, sessionToken);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error adding to cart:", error);
    throw new AppError("Failed to add product to cart.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
  userId?: string | null,
  sessionToken?: string | null
): Promise<CartDTO> {
  try {
    const cart = await getOrCreateCart(userId, sessionToken);

    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
    });

    if (!item) {
      throw new AppError("Cart item not found.", "INVALID_REQUEST", 404);
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    } else {
      const clampedQty = Math.min(quantity, 10);
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity: clampedQty },
      });
    }

    return await getCart(userId, sessionToken);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error updating cart item quantity:", error);
    throw new AppError("Failed to update cart quantity.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function removeCartItem(
  cartItemId: string,
  userId?: string | null,
  sessionToken?: string | null
): Promise<CartDTO> {
  try {
    const cart = await getOrCreateCart(userId, sessionToken);

    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, cartId: cart.id },
    });

    return await getCart(userId, sessionToken);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error removing cart item:", error);
    throw new AppError("Failed to remove item from cart.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function clearCart(cartId: string) {
  try {
    await prisma.cartItem.deleteMany({
      where: { cartId },
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw new AppError("Failed to clear cart.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function mergeGuestCart(sessionToken: string, userId: string) {
  try {
    const guestCart = await prisma.cart.findUnique({
      where: { sessionToken },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) return;

    let userCart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!userCart) {
      userCart = await prisma.cart.create({ data: { userId } });
    }

    // Transfer each item
    for (const gItem of guestCart.items) {
      const existingUserItem = await prisma.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: userCart.id,
            variantId: gItem.variantId,
          },
        },
      });

      if (existingUserItem) {
        await prisma.cartItem.update({
          where: { id: existingUserItem.id },
          data: {
            quantity: Math.min(10, existingUserItem.quantity + gItem.quantity),
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId: gItem.variantId,
            quantity: gItem.quantity,
          },
        });
      }
    }

    // Delete guest cart
    await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
    await prisma.cart.delete({ where: { id: guestCart.id } });
  } catch (error) {
    console.error("Error merging guest cart:", error);
  }
}
