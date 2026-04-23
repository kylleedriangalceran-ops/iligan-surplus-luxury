import { SkeletonCard } from "@/components/shared/Skeletons";

export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1E] py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <header className="mb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-[#1C1C1E]/10 pb-8">
          <div className="space-y-4">
            <div className="h-10 w-72 bg-[#1C1C1E]/5 skeleton-shimmer rounded-sm" />
            <div className="h-4 w-96 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
          </div>
          <div className="h-5 w-32 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
        </header>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
