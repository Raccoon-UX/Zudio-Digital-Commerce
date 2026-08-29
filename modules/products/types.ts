export interface ProductCardDTO {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  secondaryImageUrl?: string | null;
  isNewArrival: boolean;
  isFeatured: boolean;
  availableSizes: string[];
  availableColors: { name: string; hexCode: string }[];
}

export interface VariantDTO {
  id: string;
  sku: string;
  sizeId: string;
  sizeName: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
}

export interface ProductImageDTO {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductDetailDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  variants: VariantDTO[];
  images: ProductImageDTO[];
  allSizes: { id: string; name: string; sortOrder: number }[];
  allColors: { id: string; name: string; hexCode: string }[];
}

export interface ProductQueryParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  sort?: "price_asc" | "price_desc" | "newest" | "featured";
  page?: number;
  limit?: number;
}

export interface PaginatedProductsDTO {
  products: ProductCardDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
