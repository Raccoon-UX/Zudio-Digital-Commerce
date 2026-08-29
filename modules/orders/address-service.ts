import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";

export interface AddressInput {
  fullName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
}

export async function getUserAddresses(userId: string) {
  try {
    return await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    throw new AppError("Failed to fetch addresses.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function createAddress(userId: string, input: AddressInput) {
  try {
    // If setting as default or if this is the user's first address, manage isDefault
    const count = await prisma.address.count({ where: { userId } });
    const isDefault = input.isDefault || count === 0;

    return await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          fullName: input.fullName.trim(),
          addressLine1: input.addressLine1.trim(),
          addressLine2: input.addressLine2 ? input.addressLine2.trim() : null,
          city: input.city.trim(),
          state: input.state.trim(),
          pincode: input.pincode.trim(),
          phone: input.phone.trim(),
          isDefault,
        },
      });
    });
  } catch (error) {
    console.error("Error creating address:", error);
    throw new AppError("Failed to save address.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: Partial<AddressInput>
) {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new AppError("Address not found.", "INVALID_REQUEST", 404);
    }

    return await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
          ...(input.addressLine1 ? { addressLine1: input.addressLine1.trim() } : {}),
          ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 ? input.addressLine2.trim() : null } : {}),
          ...(input.city ? { city: input.city.trim() } : {}),
          ...(input.state ? { state: input.state.trim() } : {}),
          ...(input.pincode ? { pincode: input.pincode.trim() } : {}),
          ...(input.phone ? { phone: input.phone.trim() } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        },
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error updating address:", error);
    throw new AppError("Failed to update address.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}

export async function deleteAddress(userId: string, addressId: string) {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new AppError("Address not found.", "INVALID_REQUEST", 404);
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error deleting address:", error);
    throw new AppError("Failed to delete address.", "INTERNAL_SERVER_ERROR", 500, error);
  }
}
