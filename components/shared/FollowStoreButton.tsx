"use client";

import React, { useState, useEffect } from "react";
import { getIsFollowing, toggleStoreFollow } from "@/app/actions/follows";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface FollowStoreButtonProps {
  storeId: string;
}

export function FollowStoreButton({ storeId }: FollowStoreButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(!storeId ? false : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!storeId) return;
    
    getIsFollowing(storeId).then((res) => {
      if (mounted) setIsFollowing(res);
    });
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing === null || loading || !storeId) return;

    setLoading(true);
    const result = await toggleStoreFollow(storeId, isFollowing);
    
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      setIsFollowing(result.isFollowing);
      toast.success(result.isFollowing ? "You're now following this store" : "Unfollowed store");
    }
    setLoading(false);
  };

  // Don't render until we know the follow state to prevent flashing
  if (isFollowing === null) {
    return <div className="w-16 h-4 bg-[#1C1C1E]/5 animate-pulse rounded" />;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 ml-1 transition-all border ${
        isFollowing 
          ? "border-transparent text-[#1C1C1E]/60 bg-[#1C1C1E]/5 hover:bg-[#1C1C1E]/10" 
          : "border-[#1C1C1E] text-[#1C1C1E] hover:bg-[#1C1C1E] hover:text-[#FAF9F6]"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
