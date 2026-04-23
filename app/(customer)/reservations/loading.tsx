export default function ReservationsLoading() {
  return (
    <div className="min-h-screen py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb skeleton */}
        <div className="mb-6">
          <div className="h-3 w-40 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
        </div>

        {/* Header skeleton */}
        <div className="mb-16 flex items-end justify-between">
          <div className="space-y-3">
            <div className="h-8 w-56 bg-[#1C1C1E]/5 skeleton-shimmer rounded-sm" />
            <div className="h-3 w-32 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
          </div>
          <div className="h-4 w-24 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
        </div>

        {/* Reservation rows skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border border-[#1C1C1E]/10 bg-[#FAF9F6]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Token skeleton */}
                <div className="flex flex-col items-center justify-center min-w-[140px] py-4 px-6 bg-[#1C1C1E]/2 border border-[#1C1C1E]/5">
                  <div className="h-7 w-24 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm mb-2" />
                  <div className="h-3 w-16 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
                </div>

                {/* Details skeleton */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-44 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm" />
                    <div className="h-4 w-16 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
                  </div>
                  <div className="h-3 w-32 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
                  <div className="h-3 w-40 bg-[#1C1C1E]/3 skeleton-shimmer rounded-sm" />
                  <div className="pt-4 border-t border-[#1C1C1E]/5 flex items-end justify-between mt-2">
                    <div className="h-5 w-20 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm" />
                    <div className="h-3 w-28 bg-[#1C1C1E]/3 skeleton-shimmer rounded-sm" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
