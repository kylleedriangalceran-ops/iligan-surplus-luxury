"use client";

import React, { useTransition } from "react";
import { removeListing } from "@/app/actions/admin";

interface LiveDrop {
  id: string;
  title: string;
  storeName: string;
  merchantName: string;
  originalPrice: number;
  reservedPrice: number;
  quantityAvailable: number;
  pickupTimeWindow: string;
  imageUrl: string | null;
  createdAt: Date;
}

export function LiveDropsTable({ drops }: { drops: LiveDrop[] }) {
  if (drops.length === 0) {
    return (
      <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6] p-12 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#1C1C1E]/5 border border-[#1C1C1E]/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#1C1C1E]/30">
            <path d="M20 12H4M12 4v16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest text-[#1C1C1E]/40 font-medium">No Active Drops</p>
        <p className="text-[10px] text-[#1C1C1E]/30 mt-1">Surplus listings will appear here when merchants create them</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6]">
      {/* Header */}
      <div className="hidden lg:grid grid-cols-[1fr_140px_100px_100px_80px_100px_80px] gap-4 px-6 py-4 border-b border-[#1C1C1E]/10 bg-[#1C1C1E]/3">
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Item / Store</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Merchant</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Original</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Surplus</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Stock</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Pickup</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Action</span>
      </div>

      {/* Rows */}
      {drops.map((drop) => (
        <DropRow key={drop.id} drop={drop} />
      ))}
    </div>
  );
}

function DropRow({ drop }: { drop: LiveDrop }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete "${drop.title}" from ${drop.storeName}? This cannot be undone.`)) return;
    startTransition(async () => {
      await removeListing(drop.id);
    });
  };

  const discount = Math.round(((drop.originalPrice - drop.reservedPrice) / drop.originalPrice) * 100);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[1fr_140px_100px_100px_80px_100px_80px] gap-2 lg:gap-4 px-6 py-5 border-b border-[#1C1C1E]/5 last:border-b-0 hover:bg-white/50 transition-colors ${isPending ? "opacity-40 pointer-events-none" : ""}`}>
      {/* Item / Store */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#1C1C1E] truncate">{drop.title}</p>
        <p className="text-[10px] text-[#1C1C1E]/40 truncate">{drop.storeName}</p>
      </div>

      {/* Merchant */}
      <span className="text-xs text-[#1C1C1E]/60 self-center truncate">{drop.merchantName}</span>

      {/* Original */}
      <span className="text-xs text-[#1C1C1E]/40 self-center line-through">₱{drop.originalPrice.toLocaleString()}</span>

      {/* Surplus */}
      <div className="self-center">
        <span className="text-xs font-medium text-[#1C1C1E]">₱{drop.reservedPrice.toLocaleString()}</span>
        <span className="text-[10px] text-emerald-600 ml-1.5 font-medium">-{discount}%</span>
      </div>

      {/* Stock */}
      <span className={`text-xs font-medium self-center ${drop.quantityAvailable <= 2 ? "text-amber-600" : "text-[#1C1C1E]"}`}>
        {drop.quantityAvailable}
      </span>

      {/* Pickup */}
      <span className="text-[10px] text-[#1C1C1E]/50 self-center">{drop.pickupTimeWindow}</span>

      {/* Action */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="self-center text-[10px] uppercase tracking-widest font-medium text-red-500/70 hover:text-red-600 transition-colors disabled:opacity-40"
      >
        {isPending ? "..." : "Delete"}
      </button>
    </div>
  );
}
