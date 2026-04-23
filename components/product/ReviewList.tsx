import { getReviewsByListingId, getAggregatedRating } from "@/lib/repositories/reviewRepository";
import { formatDistanceToNow } from "date-fns";

interface ReviewListProps {
  listingId: string;
}

export async function ReviewList({ listingId }: ReviewListProps) {
  const [reviews, aggregated] = await Promise.all([
    getReviewsByListingId(listingId),
    getAggregatedRating(listingId),
  ]);

  return (
    <div className="space-y-5">
      {/* Aggregated Rating */}
      <div className="flex items-baseline gap-2">
        {aggregated.count > 0 ? (
          <>
            <span className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
              {aggregated.average.toFixed(1)}
            </span>
            <span className="text-[#1C1C1E]/70 text-sm">★</span>
            <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-medium ml-1">
              {aggregated.count} {aggregated.count === 1 ? "review" : "reviews"}
            </span>
          </>
        ) : (
          <span className="text-[11px] uppercase tracking-widest text-[#1C1C1E]/40 font-medium">
            No reviews yet
          </span>
        )}
      </div>

      {/* Review Cards */}
      {reviews.length > 0 && (
        <div className="space-y-4 pt-2">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-3">
              {/* User initial avatar */}
              <div className="w-8 h-8 rounded-full bg-[#1C1C1E]/6 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-[#1C1C1E]">
                  {review.customerName.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-semibold text-[#1C1C1E] truncate">
                    {review.customerName}
                  </span>
                  {/* Rating dots */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`w-1.5 h-1.5 rounded-full ${
                          n <= review.rating ? "bg-[#1C1C1E]" : "bg-[#1C1C1E]/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-[13px] text-[#1C1C1E]/70 leading-relaxed">
                    {review.comment}
                  </p>
                )}

                <p className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/30 mt-1.5 font-medium">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
