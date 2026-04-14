import { query } from "../db";

export type SurplusDropStatus = "LIVE" | "SOLD_OUT" | "ARCHIVED";

export interface SurplusDrop {
  id: string;
  productId: string;
  quantity: number;
  discountPrice: number;
  status: SurplusDropStatus;
  createdAt: Date;
}

export async function createSurplusDrop(input: {
  productId: string;
  quantity: number;
  discountPrice: number;
}): Promise<SurplusDrop> {
  const res = await query(
    `INSERT INTO surplus_drops (product_id, quantity, discount_price)
     VALUES ($1, $2, $3)
     RETURNING id, product_id, quantity, discount_price, status, created_at`,
    [input.productId, input.quantity, input.discountPrice]
  );

  const r = res.rows[0];
  return {
    id: r.id,
    productId: r.product_id,
    quantity: r.quantity,
    discountPrice: parseFloat(r.discount_price),
    status: r.status as SurplusDropStatus,
    createdAt: new Date(r.created_at),
  };
}

