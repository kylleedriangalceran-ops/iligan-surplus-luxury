"use client";

import React from "react";
import { motion } from "framer-motion";

interface SkeletonCardProps {
  index?: number;
}

export function SkeletonCard({ index = 0 }: SkeletonCardProps) {
  return (
    <motion.div
      className="flex flex-col bg-[#FAF9F6] border border-[#1C1C1E]/10 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Image skeleton */}
      <div className="relative aspect-4/5 w-full overflow-hidden bg-[#1C1C1E]/4">
        <div className="absolute inset-0 skeleton-shimmer" />
        {/* Badge skeleton */}
        <div className="absolute top-4 left-4">
          <div className="h-5 w-20 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm" />
          <div className="h-3 w-1/2 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
        </div>
        <div className="pt-4 border-t border-[#1C1C1E]/5 flex items-end justify-between">
          <div className="space-y-1.5">
            <div className="h-3 w-14 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
            <div className="h-4 w-20 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm" />
          </div>
          <div className="h-4 w-16 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
        </div>
      </div>
    </motion.div>
  );
}

export function SkeletonRow({ index = 0 }: SkeletonCardProps) {
  return (
    <motion.div
      className="border border-border/40 bg-card p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-40 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm" />
            <div className="h-4 w-16 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
          </div>
          <div className="h-3 w-48 bg-[#1C1C1E]/4 skeleton-shimmer rounded-sm" />
          <div className="h-3 w-32 bg-[#1C1C1E]/3 skeleton-shimmer rounded-sm" />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center space-y-1">
            <div className="h-6 w-20 bg-[#1C1C1E]/6 skeleton-shimmer rounded-sm mx-auto" />
            <div className="h-3 w-12 bg-[#1C1C1E]/3 skeleton-shimmer rounded-sm mx-auto" />
          </div>
          <div className="h-5 w-16 bg-[#1C1C1E]/5 skeleton-shimmer rounded-sm" />
        </div>
      </div>
    </motion.div>
  );
}
