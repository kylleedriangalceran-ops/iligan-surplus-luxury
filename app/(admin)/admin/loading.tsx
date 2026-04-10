import React from "react";

export default function AdminLoading() {
  return (
    <div className="min-h-screen py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-16 space-y-3">
          <div className="h-8 w-56 bg-[#1C1C1E]/5 skeleton-shimmer rounded-sm" />
          <div className="h-4 w-72 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-[#1C1C1E]/10 bg-[#FAF9F6] p-5 flex flex-col items-center">
              <div className="h-7 w-12 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm mb-2" />
              <div className="h-3 w-20 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="mb-8">
          <div className="h-4 w-28 bg-[#1C1C1E]/5 skeleton-shimmer rounded-sm" />
        </div>
        <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-5 border-b border-[#1C1C1E]/5 flex items-center gap-4">
              <div className="w-7 h-7 rounded-full bg-[#1C1C1E]/5 skeleton-shimmer shrink-0" />
              <div className="h-4 w-32 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm" />
              <div className="h-3 w-44 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
              <div className="h-4 w-16 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
