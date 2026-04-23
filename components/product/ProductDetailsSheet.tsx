"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ReserveButton } from "@/components/shared/ReserveButton";
import { ReviewSkeleton } from "./ReviewSkeleton";
import { ReviewForm } from "./ReviewForm";
import { formatDistanceToNow } from "date-fns";
import { openChatWith } from "@/components/shared/FloatingChatWidget";

interface ProductDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  item: {
    title: string;
    merchant: string;
    merchantId?: string;
    originalPrice: number;
    surplusPrice: number;
    imageUrl?: string | null;
    availableCount: number;
    hasReserved?: boolean;
  };
  action?: (formData: FormData) => void;
}

// ─── Types for review data ────────────────────────────────────
interface ReviewData {
  id: string;
  customerId: string;
  customerName: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: ReviewData[];
  aggregated: { average: number; count: number };
  canReview: boolean;
}

export function ProductDetailsSheet({
  isOpen,
  onClose,
  listingId,
  item,
  action,
}: ProductDetailsSheetProps) {
  const [reviewData, setReviewData] = useState<ReviewsResponse | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!listingId) return;
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews/${listingId}`, { cache: "no-store" });
      if (res.ok) {
        const data: ReviewsResponse = await res.json();
        setReviewData(data);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingReviews(false);
    }
  }, [listingId]);

  // Fetch reviews when sheet opens
  useEffect(() => {
    if (isOpen) {
      fetchReviews();
    } else {
      setReviewData(null);
    }
  }, [isOpen, fetchReviews]);

  const isSoldOut = item.availableCount <= 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[480px] bg-[#FAF9F6] border-l border-[#1C1C1E]/10 p-0 overflow-y-auto flex flex-col"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-[#1C1C1E]/60 hover:text-[#1C1C1E] transition-all shadow-sm"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Product Image */}
        <div className="relative w-full aspect-4/5 bg-[#1C1C1E]/5 shrink-0">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="480px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[#1C1C1E]/30 text-xs uppercase tracking-widest font-light">
                No Image
              </span>
            </div>
          )}

          {/* Availability badge */}
          <div className="absolute bottom-4 left-4 z-10">
            {isSoldOut ? (
              <div className="bg-white/70 backdrop-blur-md px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[#1C1C1E] font-medium">
                Sold Out
              </div>
            ) : (
              <div className="bg-[#FAF9F6]/80 backdrop-blur-md px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[#1C1C1E] font-medium border border-[#1C1C1E]/10">
                {item.availableCount} Available
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6 md:p-8">
          <SheetHeader className="p-0 mb-6 gap-0">
            <SheetTitle className="text-xl font-light tracking-tight text-[#1C1C1E] leading-tight mb-2">
              {item.title}
            </SheetTitle>
            <SheetDescription className="contents">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1C1C1E]/10 overflow-hidden relative">
                  <Image src="/pattern.svg" alt="Avatar" fill className="opacity-50 object-cover" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-medium">
                  {item.merchant}
                </span>

                {/* Live aggregated rating */}
                {reviewData && reviewData.aggregated.count > 0 && (
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[#1C1C1E] text-[11px]">★</span>
                    <span className="text-[12px] font-bold text-[#1C1C1E]">
                      {reviewData.aggregated.average.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-[#1C1C1E]/40 ml-0.5">
                      ({reviewData.aggregated.count})
                    </span>
                  </div>
                )}
              </div>
            </SheetDescription>
          </SheetHeader>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/40 font-semibold mb-2">
              Description
            </h4>
            <p className="text-sm text-[#1C1C1E]/70 leading-relaxed font-light">
              Perfectly crafted and freshly prepared today. Quality surplus reserved exclusively for
              our members. Please ensure you can pick up during the designated window.
            </p>
          </div>

          {/* Price comparison */}
          <div className="flex justify-between py-4 border-y border-[#1C1C1E]/10 mb-6">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/40 font-semibold mb-1">
                Original Value
              </h4>
              <p className="text-sm line-through text-[#1C1C1E]/50">
                ₱{item.originalPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/40 font-semibold mb-1">
                Surplus Price
              </h4>
              <p className="text-xl font-medium tracking-tight text-[#1C1C1E]">
                ₱{item.surplusPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Reviews Section — streams in with skeleton */}
          <div className="mb-6">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/40 font-semibold mb-4">
              Reviews
            </h4>
            {isLoadingReviews ? (
              <ReviewSkeleton />
            ) : reviewData ? (
              <>
                {/* Review list */}
                <div className="space-y-5">
                  {reviewData.aggregated.count > 0 ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
                          {reviewData.aggregated.average.toFixed(1)}
                        </span>
                        <span className="text-[#1C1C1E]/70 text-sm">★</span>
                        <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-medium ml-1">
                          {reviewData.aggregated.count}{" "}
                          {reviewData.aggregated.count === 1 ? "review" : "reviews"}
                        </span>
                      </div>

                      <div className="space-y-4 pt-2">
                        {reviewData.reviews.map((review) => (
                          <div key={review.id} className="flex gap-3">
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
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <div
                                      key={n}
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        n <= review.rating
                                          ? "bg-[#1C1C1E]"
                                          : "bg-[#1C1C1E]/10"
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
                                {formatDistanceToNow(new Date(review.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-[11px] uppercase tracking-widest text-[#1C1C1E]/40 font-medium">
                      No reviews yet
                    </span>
                  )}
                </div>

                {/* Review form */}
                <ReviewForm listingId={listingId} canReview={reviewData.canReview} />
              </>
            ) : null}
          </div>

          {/* CTAs */}
          <div className="mt-auto pt-6 flex flex-col gap-3">
            {action ? (
              <div className="w-full shrink-0" onClick={onClose}>
                <ReserveButton
                  action={action}
                  disabled={isSoldOut}
                  hasReserved={item.hasReserved}
                  fullWidth
                />
              </div>
            ) : (
              <button
                disabled={isSoldOut || item.hasReserved}
                className="w-full text-xs font-medium uppercase tracking-[0.25em] py-4 px-6 bg-[#1C1C1E] text-[#FAF9F6] rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {item.hasReserved
                  ? "Reserved"
                  : isSoldOut
                  ? "Out of Stock"
                  : "Reserve Now"}
              </button>
            )}

            {/* Message Merchant */}
            {item.merchantId && (
              <button
                onClick={() => {
                  if (item.merchantId) {
                    openChatWith(item.merchantId, item.merchant);
                    onClose();
                  }
                }}
                className="w-full text-[10px] font-semibold uppercase tracking-[0.2em] py-4 px-6 border border-[#1C1C1E]/15 text-[#1C1C1E] rounded-[8px] transition-all hover:bg-[#1C1C1E]/3 flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Message Merchant
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
