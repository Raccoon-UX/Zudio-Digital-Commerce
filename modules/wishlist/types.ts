import { ProductCardDTO } from "@/modules/products/types";

export interface WishlistDTO {
  id: string;
  userId: string;
  items: {
    id: string;
    productId: string;
    product: ProductCardDTO;
    createdAt: string;
  }[];
  count: number;
}
