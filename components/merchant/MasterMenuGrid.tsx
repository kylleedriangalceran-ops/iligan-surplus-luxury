"use client";

import Image from "next/image";
import { Product } from "@/lib/repositories/productRepository";
import { Card, CardContent } from "@/components/ui/card";
import { QuickDropDialog } from "@/components/merchant/QuickDropDialog";

export function MasterMenuGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((p) => (
        <Card key={p.id} className="border-[#1C1C1E]/10 bg-white/60 backdrop-blur-sm overflow-hidden">
          <div className="relative aspect-4/5 w-full bg-[#1C1C1E]/5">
            {p.imageUrl ? (
              <Image
                src={p.imageUrl}
                alt={p.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs uppercase tracking-widest text-[#1C1C1E]/30">No Image</span>
              </div>
            )}
          </div>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold tracking-tight text-[#1C1C1E] truncate">
                  {p.name}
                </h3>
                {p.description ? (
                  <p className="mt-2 text-xs text-[#1C1C1E]/55 line-clamp-2">
                    {p.description}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[#1C1C1E]/35 uppercase tracking-widest">
                    No description
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/50">
                  Base
                </p>
                <p className="text-sm font-semibold text-[#1C1C1E]">
                  ₱{p.originalPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <QuickDropDialog productId={p.id} originalPrice={p.originalPrice} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

