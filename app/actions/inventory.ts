"use server";

import { auth } from "@/lib/auth";
import { findStoreByMerchantId } from "@/lib/repositories/storeRepository";
import { createProduct, getProductById } from "@/lib/repositories/productRepository";
import { createSurplusDrop } from "@/lib/repositories/surplusDropRepository";
import { createListing } from "@/lib/repositories/listingRepository";
import { revalidatePath } from "next/cache";

const DEFAULT_PICKUP_WINDOW = "Today, 5:00 PM - 9:00 PM";

export async function addMasterMenuItem(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const originalPriceRaw = String(formData.get("originalPrice") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();

  const originalPrice = Number(originalPriceRaw);
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) return { error: "Base price must be a valid amount." };

  await createProduct({
    merchantId: session.user.id,
    name,
    description: description || undefined,
    originalPrice,
    imageUrl: imageUrl || null,
  });

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function quickPublishDrop(input: {
  productId: string;
  quantity: number;
  discountedPrice?: number;
  percentOff?: number;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MERCHANT") {
    return { error: "Unauthorized" };
  }

  const store = await findStoreByMerchantId(session.user.id);
  if (!store) return { error: "You must create a store first." };

  const product = await getProductById(input.productId);
  if (!product) return { error: "Product not found." };
  if (product.merchantId !== session.user.id) return { error: "Unauthorized" };

  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Quantity must be at least 1." };

  let reservedPrice: number | null = null;
  if (input.discountedPrice != null && Number.isFinite(Number(input.discountedPrice))) {
    reservedPrice = Number(input.discountedPrice);
  } else if (input.percentOff != null && Number.isFinite(Number(input.percentOff))) {
    const pct = Number(input.percentOff);
    if (pct <= 0 || pct >= 100) return { error: "Percent off must be between 1 and 99." };
    reservedPrice = Math.round((product.originalPrice * (1 - pct / 100)) * 100) / 100;
  }

  if (reservedPrice == null || reservedPrice <= 0) return { error: "Discounted price must be valid." };
  if (reservedPrice >= product.originalPrice) return { error: "Discounted price must be lower than base price." };

  // 1) Create SurplusDrop (new system of record)
  await createSurplusDrop({
    productId: product.id,
    quantity,
    discountPrice: reservedPrice,
  });

  // 2) Create live listing for existing feed/map pipeline
  await createListing({
    storeId: store.id,
    title: product.name,
    originalPrice: product.originalPrice,
    reservedPrice,
    quantityAvailable: quantity,
    pickupTimeWindow: DEFAULT_PICKUP_WINDOW,
    imageUrl: product.imageUrl || undefined,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/feed");
  revalidatePath("/map");
  return { success: true };
}

