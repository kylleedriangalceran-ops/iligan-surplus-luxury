import { cache } from "react";
import { query } from "../db";
import { getJsonCache, setJsonCache } from "../redisCache";
import { CACHE_KEYS, CACHE_TTL, invalidateProductCaches } from "../cacheInvalidation";

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  originalPrice: number;
  imageUrl: string | null;
  createdAt: Date;
}

type CachedProduct = Omit<Product, "createdAt"> & { createdAt: string };

function rehydrate(row: CachedProduct): Product {
  return { ...row, createdAt: new Date(row.createdAt) };
}

export const getProductsByMerchantId = cache(async (merchantId: string): Promise<Product[]> => {
  const cacheKey = `${CACHE_KEYS.PRODUCTS_BY_MERCHANT_PREFIX}${merchantId}`;
  const cached = await getJsonCache<CachedProduct[]>(cacheKey);
  if (cached) return cached.map(rehydrate);

  const res = await query(
    `SELECT id, merchant_id, name, description, original_price, image_url, created_at
     FROM products
     WHERE merchant_id = $1
     ORDER BY created_at DESC`,
    [merchantId]
  );

  const products: Product[] = res.rows.map((r) => ({
    id: r.id,
    merchantId: r.merchant_id,
    name: r.name,
    description: r.description ?? null,
    originalPrice: parseFloat(r.original_price),
    imageUrl: r.image_url ?? null,
    createdAt: new Date(r.created_at),
  }));

  const toCache: CachedProduct[] = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));
  await setJsonCache(cacheKey, toCache, CACHE_TTL.PRODUCTS);
  return products;
});

export async function createProduct(input: {
  merchantId: string;
  name: string;
  description?: string;
  originalPrice: number;
  imageUrl?: string | null;
}): Promise<Product> {
  const res = await query(
    `INSERT INTO products (merchant_id, name, description, original_price, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, merchant_id, name, description, original_price, image_url, created_at`,
    [
      input.merchantId,
      input.name,
      input.description || null,
      input.originalPrice,
      input.imageUrl || null,
    ]
  );

  const r = res.rows[0];
  const product: Product = {
    id: r.id,
    merchantId: r.merchant_id,
    name: r.name,
    description: r.description ?? null,
    originalPrice: parseFloat(r.original_price),
    imageUrl: r.image_url ?? null,
    createdAt: new Date(r.created_at),
  };

  await invalidateProductCaches(input.merchantId);
  return product;
}

export async function getProductById(productId: string): Promise<Product | null> {
  const res = await query(
    `SELECT id, merchant_id, name, description, original_price, image_url, created_at
     FROM products
     WHERE id = $1`,
    [productId]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    merchantId: r.merchant_id,
    name: r.name,
    description: r.description ?? null,
    originalPrice: parseFloat(r.original_price),
    imageUrl: r.image_url ?? null,
    createdAt: new Date(r.created_at),
  };
}

