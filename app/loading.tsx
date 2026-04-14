import React from "react";
import { SkeletonCard } from "@/components/shared/Skeletons";

export default function Loading() {
  return (
    <div className="w-full min-h-[80vh] container mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col space-y-4">
        <div className="w-48 h-8 bg-[#1C1C1E]/5 rounded-md animate-pulse"></div>
        <div className="w-80 h-4 bg-[#1C1C1E]/5 rounded-md animate-pulse"></div>
      </div>
      
      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
