"use client";

import React, { useState, useTransition } from "react";
import { submitReview } from "@/app/actions/reviews";
import { useToast } from "@/hooks/useToast";

interface ReviewFormProps {
  listingId: string;
  canReview: boolean; // true if user has CLAIMED reservation and hasn't reviewed yet
}

export function ReviewForm({ listingId, canReview }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  if (!canReview || submitted) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (rating === 0) {
      toast("Please select a rating.", "error");
      return;
    }

    const formData = new FormData();
    formData.set("listingId", listingId);
    formData.set("rating", String(rating));
    formData.set("comment", comment);

    startTransition(async () => {
      const result = await submitReview(formData);
      if (result.error) {
        toast(result.error, "error");
      } else {
        toast("Review submitted!", "success");
        setSubmitted(true);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="pt-5 border-t border-[#1C1C1E]/5 space-y-4">
      <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-semibold">
        Leave a Review
      </p>

      {/* Rating selector — clickable circles */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`w-9 h-9 rounded-full border-2 text-[12px] font-bold transition-all duration-200 ${
              n <= rating
                ? "bg-[#1C1C1E] text-[#FAF9F6] border-[#1C1C1E]"
                : "bg-transparent text-[#1C1C1E]/40 border-[#1C1C1E]/15 hover:border-[#1C1C1E]/40"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Comment textarea */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Share your experience (optional)"
        className="w-full bg-transparent border-b border-[#1C1C1E]/15 focus:border-[#1C1C1E] outline-none text-[13px] text-[#1C1C1E] placeholder:text-[#1C1C1E]/30 pb-2 resize-none transition-colors"
      />

      <div className="flex items-center justify-between">
        <span className="text-[9px] text-[#1C1C1E]/30 tabular-nums">
          {comment.length}/500
        </span>
        <button
          type="submit"
          disabled={isPending || rating === 0}
          className="px-5 py-2.5 bg-[#1C1C1E] text-[#FAF9F6] text-[10px] font-semibold uppercase tracking-widest rounded-[8px] hover:bg-[#1C1C1E]/90 disabled:opacity-40 transition-all"
        >
          {isPending ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
