"use client";

import React, { useState } from "react";
import { ActiveListing } from "@/lib/repositories/listingRepository";
import { LuxuryItemCard } from "@/components/shared/LuxuryItemCard";

interface DashboardDropsProps {
  listings: ActiveListing[];
}

export function DashboardDrops({ listings }: DashboardDropsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Showing 8 cards per page

  const filteredListings = listings.filter((listing) => {
    const query = searchQuery.toLowerCase();
    return (
      listing.title.toLowerCase().includes(query) ||
      listing.reservedPrice.toString().includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div>
      {/* Search Bar - Icon Beside It */}
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <div className="flex items-center justify-center shrink-0 text-[#1C1C1E]">
            <svg 
              width="20" 
              height="20" 
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
            placeholder="Search drops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-b border-[#1C1C1E]/20 bg-transparent py-2 text-sm text-[#1C1C1E] outline-none transition-colors focus:border-[#1C1C1E] placeholder:text-[#1C1C1E]/40"
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {paginatedListings.map((listing, index) => (
              <LuxuryItemCard
                key={listing.id}
                title={listing.title}
                merchant={listing.storeName}
                originalPrice={listing.originalPrice}
                surplusPrice={listing.reservedPrice}
                imageUrl={listing.imageUrl}
                availableCount={listing.quantityAvailable}
                index={index}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="py-6 flex items-center justify-between border-t border-[#1C1C1E]/10 mt-8">
              <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-medium">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredListings.length)} of {filteredListings.length} Drops
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-all"
                >
                  Prev
                </button>
                <div className="flex items-center justify-center px-4 py-2 text-[10px] font-medium border border-transparent">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
