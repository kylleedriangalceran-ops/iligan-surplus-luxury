import React from "react";

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="space-y-3">
          <div className="h-8 w-52 bg-[#1C1C1E]/[0.05] skeleton-shimmer rounded-sm" />
          <div className="h-4 w-36 bg-[#1C1C1E]/[0.04] skeleton-shimmer rounded-sm" />
        </div>
        <div className="h-10 w-36 bg-[#1C1C1E]/[0.05] skeleton-shimmer rounded-sm" />
      </div>

      {/* Section header skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div className="h-4 w-28 bg-[#1C1C1E]/[0.05] skeleton-shimmer rounded-sm" />
        <div className="h-4 w-32 bg-[#1C1C1E]/[0.04] skeleton-shimmer rounded-sm" />
      </div>

      {/* Listing rows skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border border-[#1C1C1E]/10 bg-[#FAF9F6] p-6"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-40 bg-[#1C1C1E]/[0.06] skeleton-shimmer rounded-sm" />
                  <div className="h-4 w-16 bg-[#1C1C1E]/[0.04] skeleton-shimmer rounded-sm" />
                </div>
                <div className="h-3 w-48 bg-[#1C1C1E]/[0.04] skeleton-shimmer rounded-sm" />
                <div className="h-3 w-32 bg-[#1C1C1E]/[0.03] skeleton-shimmer rounded-sm" />
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center space-y-1.5">
                  <div className="h-6 w-20 bg-[#1C1C1E]/[0.06] skeleton-shimmer rounded-sm mx-auto" />
                  <div className="h-3 w-12 bg-[#1C1C1E]/[0.03] skeleton-shimmer rounded-sm mx-auto" />
                </div>
                <div className="h-5 w-16 bg-[#1C1C1E]/[0.05] skeleton-shimmer rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
