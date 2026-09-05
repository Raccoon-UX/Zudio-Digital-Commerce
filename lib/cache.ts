/**
 * In-Memory LRU & TTL Cache Layer for Serverless Execution
 * 
 * Provides sub-millisecond data retrieval within active serverless instances,
 * paired with Next.js ISR and Vercel Edge CDN HTTP headers for multi-tier performance.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds = 60): void {
    if (this.cache.size >= this.maxSize) {
      // Evict the oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deletePattern(prefix: string): void {
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds = 60
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

export const memoryCache = new MemoryCache(1000);

/**
 * Creates a deterministic, normalized cache key for product catalog queries.
 * Incorporates all filter parameters to ensure strict cache safety across distinct filters.
 */
export function buildProductCacheKey(params: {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  sort?: string;
  page?: number;
  limit?: number;
}): string {
  const parts = [
    `q:${(params.search || "").trim().toLowerCase()}`,
    `cat:${(params.category || "all").trim().toLowerCase()}`,
    `minP:${params.minPrice !== undefined ? params.minPrice : "none"}`,
    `maxP:${params.maxPrice !== undefined ? params.maxPrice : "none"}`,
    `sizes:${(params.sizes || []).slice().sort().join(",") || "all"}`,
    `colors:${(params.colors || []).slice().sort().join(",") || "all"}`,
    `sort:${params.sort || "featured"}`,
    `p:${params.page || 1}`,
    `lim:${params.limit || 12}`,
  ];
  return `products:${parts.join("|")}`;
}
