"use client";

import React, { useState } from "react";
import { ActiveListing } from "@/lib/repositories/listingRepository";
import { DropDetailModal } from "@/components/shared/DropDetailModal";

interface DashboardTableProps {
  listings: ActiveListing[];
}

export function DashboardTable({ listings }: DashboardTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedListing, setSelectedListing] = useState<ActiveListing | null>(null);
  const itemsPerPage = 5;

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
      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 border border-[#1C1C1E]/10 bg-white/50 text-[#1C1C1E]/40">
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
          placeholder="Search drops by title or price..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-xs px-4 py-2 bg-white/50 border border-[#1C1C1E]/10 text-xs font-medium tracking-wide text-[#1C1C1E] outline-none transition-colors focus:border-[#1C1C1E]/30 placeholder:text-[#1C1C1E]/30 placeholder:uppercase placeholder:tracking-widest"
        />
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
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredListings.length)} of {filteredListings.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E]/5 transition-colors"
                >
                  Prev
                </button>
                <div className="flex px-4 py-2 text-[10px] font-medium border border-[#1C1C1E]/10 bg-white/50">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E]/5 transition-colors"
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
