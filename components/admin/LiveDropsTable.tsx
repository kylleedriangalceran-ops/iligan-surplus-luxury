"use client";

import React, { useTransition, useState, useCallback } from "react";
import { removeListing } from "@/app/actions/admin";
import { usePagination } from "@/hooks/usePagination";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [sortFilter, setSortFilter] = useState("NEWEST");

  const filterFn = useCallback(
    (drop: LiveDrop, q: string) => {
      const matchesSearch = drop.title.toLowerCase().includes(q) ||
        drop.storeName.toLowerCase().includes(q) ||
        drop.merchantName.toLowerCase().includes(q);
        
      const matchesStock = 
        stockFilter === "ALL" || 
        (stockFilter === "IN_STOCK" && drop.quantityAvailable > 2) ||
        (stockFilter === "LOW_STOCK" && drop.quantityAvailable <= 2 && drop.quantityAvailable > 0) ||
        (stockFilter === "OUT_OF_STOCK" && drop.quantityAvailable === 0);
        
      return matchesSearch && matchesStock;
    },
    [stockFilter]
  );

  const sortedDrops = React.useMemo(() => {
    const list = [...drops];
    if (sortFilter === "PRICE_LOW_HIGH") return list.sort((a, b) => a.reservedPrice - b.reservedPrice);
    if (sortFilter === "PRICE_HIGH_LOW") return list.sort((a, b) => b.reservedPrice - a.reservedPrice);
    if (sortFilter === "STOCK_LOW") return list.sort((a, b) => a.quantityAvailable - b.quantityAvailable);
    // NEWEST by default
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [drops, sortFilter]);

  const {
    filteredItems: filteredDrops,
    paginatedItems: paginatedDrops,
    currentPage,
    totalPages,
    setCurrentPage,
    showingFrom,
    showingTo,
    totalFiltered,
  } = usePagination({ items: sortedDrops, itemsPerPage: 8, searchQuery, filterFn });

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center w-full max-w-md">
          <div className="flex items-center justify-center w-10 h-10 border border-[#1C1C1E]/10 rounded-l-md bg-white/50 text-[#1C1C1E]/40 shrink-0">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active drops by item, store, or merchant..."
            className="w-full px-4 py-2 bg-white/50 border-y border-r border-[#1C1C1E]/10 rounded-r-md h-10 text-xs font-medium tracking-wide text-[#1C1C1E] outline-none transition-colors focus:border-[#1C1C1E]/30 placeholder:text-[#1C1C1E]/30 placeholder:uppercase placeholder:tracking-widest"
          />
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <FilterDropdown
            label="Stock:"
            options={[
              { label: "All Items", value: "ALL" },
              { label: "In Stock", value: "IN_STOCK" },
              { label: "Low Stock", value: "LOW_STOCK" },
              { label: "Out of Stock", value: "OUT_OF_STOCK" },
            ]}
            value={stockFilter}
            onChange={setStockFilter}
          />
          <FilterDropdown
            label="Sort:"
            options={[
              { label: "Newest First", value: "NEWEST" },
              { label: "Price (Low-High)", value: "PRICE_LOW_HIGH" },
              { label: "Price (High-Low)", value: "PRICE_HIGH_LOW" },
              { label: "Lowest Stock", value: "STOCK_LOW" },
            ]}
            value={sortFilter}
            onChange={setSortFilter}
          />
        </div>
      </div>

      <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6]">
        <div className="hidden lg:grid grid-cols-[1fr_140px_100px_100px_80px_100px_80px] gap-4 px-6 py-4 border-b border-[#1C1C1E]/10 bg-[#1C1C1E]/3">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Item / Store</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Merchant</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Original</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Surplus</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40 text-center">Stock</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Pickup</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40 text-center">Action</span>
        </div>

        {/* Rows */}
        {filteredDrops.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs text-[#1C1C1E]/40">No active drops match your search.</p>
          </div>
        ) : (
          paginatedDrops.map((drop) => (
            <DropRow key={drop.id} drop={drop} />
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4 px-6 flex items-center justify-between border-t border-[#1C1C1E]/10 bg-[#FAF9F6]">
            <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-medium">
              Showing {showingFrom}-{showingTo} of {totalFiltered}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-all"
              >
                Prev
              </button>
              <div className="flex items-center justify-center px-2 py-1.5 rounded-md border border-[#1C1C1E]/20 text-[10px] bg-white/50 font-medium">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DropRow({ drop }: { drop: LiveDrop }) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(false);
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
      <span className={`text-xs font-medium self-center text-center ${drop.quantityAvailable <= 2 ? "text-amber-600" : "text-[#1C1C1E]"}`}>
        {drop.quantityAvailable}
      </span>

      {/* Pickup */}
      <span className="text-[10px] text-[#1C1C1E]/50 self-center">{drop.pickupTimeWindow}</span>

      {/* Action */}
      <div className="w-full self-center flex items-center justify-center">
        <button
          onClick={() => setShowDeleteDialog(true)}
          disabled={isPending}
          title="Delete Drop"
          className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
        >
          {isPending ? (
            <span className="text-[10px]">...</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          )}
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#FAF9F6] border-[#1C1C1E]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1C1C1E] text-base font-semibold">
              Delete Drop
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#1C1C1E]/60 text-sm">
              Delete &quot;{drop.title}&quot; from {drop.storeName}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-[#1C1C1E]/20 text-[#1C1C1E] hover:bg-[#1C1C1E]/5 text-xs uppercase tracking-widest font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 text-xs uppercase tracking-widest font-medium"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
