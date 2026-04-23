"use client";

export function ReviewSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Aggregated rating skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-12 bg-[#1C1C1E]/5 rounded" />
        <div className="h-3 w-24 bg-[#1C1C1E]/5 rounded" />
      </div>

      {/* Review card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1C1C1E]/5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 bg-[#1C1C1E]/5 rounded" />
              <div className="h-2 w-12 bg-[#1C1C1E]/5 rounded" />
            </div>
            <div className="h-3 w-full bg-[#1C1C1E]/5 rounded" />
            <div className="h-3 w-3/4 bg-[#1C1C1E]/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
