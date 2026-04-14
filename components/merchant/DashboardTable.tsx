"use client";

import React, { useState, useCallback } from "react";
import { ActiveListing } from "@/lib/repositories/listingRepository";
import { DropDetailModal } from "@/components/shared/DropDetailModal";
import { usePagination } from "@/hooks/usePagination";
import { FilterDropdown } from "@/components/shared/FilterDropdown";

interface DashboardTableProps {
  listings: ActiveListing[];
}

export function DashboardTable({ listings }: DashboardTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [sortFilter, setSortFilter] = useState("NEWEST");
  const [selectedListing, setSelectedListing] = useState<ActiveListing | null>(null);

  const filterFn = useCallback(
    (listing: ActiveListing, q: string) => {
      const matchesSearch = listing.title.toLowerCase().includes(q) ||
        listing.reservedPrice.toString().includes(q);
        
      const matchesStock = 
        stockFilter === "ALL" || 
        (stockFilter === "IN_STOCK" && listing.quantityAvailable > 2) ||
        (stockFilter === "LOW_STOCK" && listing.quantityAvailable <= 2 && listing.quantityAvailable > 0) ||
        (stockFilter === "OUT_OF_STOCK" && listing.quantityAvailable === 0);
        
      return matchesSearch && matchesStock;
    },
    [stockFilter]
  );

  const sortedListings = React.useMemo(() => {
    const list = [...listings];
    if (sortFilter === "PRICE_LOW_HIGH") return list.sort((a, b) => a.reservedPrice - b.reservedPrice);
    if (sortFilter === "PRICE_HIGH_LOW") return list.sort((a, b) => b.reservedPrice - a.reservedPrice);
    if (sortFilter === "STOCK_LOW") return list.sort((a, b) => a.quantityAvailable - b.quantityAvailable);
    // NEWEST by default
    return list.sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
  }, [listings, sortFilter]);

  const {
    filteredItems: filteredListings,
    paginatedItems: paginatedListings,
    currentPage,
    totalPages,
    startIndex,
    setCurrentPage,
    showingFrom,
    showingTo,
    totalFiltered,
  } = usePagination({ items: sortedListings, itemsPerPage: 5, searchQuery, filterFn });

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div className="relative w-full max-w-md">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1E]/40 pointer-events-none">
            <svg 
              width="18" 
              height="18" 
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
            placeholder="Search drops by title or price..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-[#1C1C1E]/10 rounded-md text-sm font-medium tracking-wide text-[#1C1C1E] outline-none transition-all focus:border-[#1C1C1E]/30 focus:shadow-sm placeholder:text-[#1C1C1E]/40"
          />
        </div>
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

      {filteredListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#1C1C1E]/10 bg-white/50">
          <p className="text-sm uppercase tracking-widest text-[#1C1C1E]/60 font-light mb-2">
            No drops found
          </p>
          <p className="text-xs text-[#1C1C1E]/40">
            {listings.length === 0 ? "Click Create Drop to publish your first surplus listing." : "Try adjusting your search query."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1C1C1E]/10">
                <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-medium">Title</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-medium">Original</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-medium">Surplus</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-medium">Stock</th>
                <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-medium whitespace-nowrap">Pickup Time</th>
              </tr>
            </thead>
            <tbody>
              {paginatedListings.map((listing) => (
                <tr 
                  key={listing.id} 
                  onClick={() => setSelectedListing(listing)}
                  className="border-b border-[#1C1C1E]/10 hover:bg-[#1C1C1E]/5 transition-colors group cursor-pointer"
                >
                  <td className="py-5 px-6">
                    <span className="text-sm font-medium tracking-wide group-hover:text-[#1C1C1E] transition-colors text-[#1C1C1E]/90">
                      {listing.title}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-xs line-through text-[#1C1C1E]/40">
                      ₱{listing.originalPrice.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-sm font-medium text-[#1C1C1E]">
                      ₱{listing.reservedPrice.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-xs font-mono tracking-widest px-2 py-1 bg-[#1C1C1E]/5 border border-[#1C1C1E]/10">
                      {listing.quantityAvailable}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/70">
                      {listing.pickupTimeWindow}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="py-6 flex items-center justify-between border-t border-[#1C1C1E]/10">
              <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-medium">
                Showing {showingFrom}-{showingTo} of {totalFiltered}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-md text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E]/5 transition-colors"
                >
                  Prev
                </button>
                <div className="flex px-4 py-2 rounded-md text-[10px] font-medium border border-[#1C1C1E]/10 bg-white/50 items-center">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-md text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E]/5 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedListing && (
        <DropDetailModal
          isOpen={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          item={{
            title: selectedListing.title,
            merchant: selectedListing.storeName,
            originalPrice: selectedListing.originalPrice,
            surplusPrice: selectedListing.reservedPrice,
            imageUrl: selectedListing.imageUrl,
            availableCount: selectedListing.quantityAvailable,
          }}
        />
      )}
    </div>
  );
}
