"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReserveButton } from "./ReserveButton";
import { DropDetailModal } from "./DropDetailModal";

interface LuxuryItemCardProps {
  title: string;
  merchant: string;
  originalPrice: number;
  surplusPrice: number;
  imageUrl?: string | null;
  availableCount: number;
  className?: string;
  action?: (formData: FormData) => void;
  index?: number;
}

export function LuxuryItemCard({
  title,
  merchant,
  originalPrice,
  surplusPrice,
  imageUrl,
  availableCount,
  className,
  action,
  index = 0,
}: LuxuryItemCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <motion.div
      className={cn(
        "group relative flex flex-col bg-[#FAF9F6] overflow-hidden border border-[#1C1C1E]/10",
        "transition-all duration-700 ease-out hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
    >
      {/* Image Frame — Editorial 4:5 Portrait */}
      <button 
        type="button" 
        onClick={() => setIsModalOpen(true)}
        className="relative aspect-[4/5] w-full overflow-hidden bg-[#1C1C1E]/5 text-left border-b border-[#1C1C1E]/5 focus:outline-none"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1C1C1E]/[0.03]">
            <span className="text-[#1C1C1E]/30 text-xs uppercase tracking-widest font-light">
              No Image
            </span>
          </div>
        )}
        
        {/* Availability Badge */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-[#FAF9F6]/80 backdrop-blur-md px-3 py-1 text-[10px] uppercase tracking-wider text-[#1C1C1E] border border-[#1C1C1E]/10">
            {availableCount} Available
          </div>
        </div>
      </button>

      {/* Content wrapper */}
      <div className="flex flex-col p-5 bg-[#FAF9F6]">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[#1C1C1E] transition-colors group-hover:text-[#1C1C1E]/80 mb-2">
              {title}
            </h3>
            
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#1C1C1E]/10 overflow-hidden relative">
                <Image src="/pattern.svg" alt="Avatar" fill className="opacity-50 object-cover" />
              </div>
              <p className="text-[10px] text-[#1C1C1E]/60 uppercase tracking-widest font-medium">
                {merchant}
              </p>
              <div className="flex items-center gap-0.5 text-[10px]">
                <span className="text-[#1C1C1E]">★</span>
                <span className="font-semibold text-[#1C1C1E]">4.8</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between pt-4 border-t border-[#1C1C1E]/10">
          <div className="flex flex-col">
            <span className="line-through text-[#1C1C1E]/40 text-xs text-start">
              ₱{originalPrice.toFixed(2)}
            </span>
            <span className="text-base font-medium tracking-tight text-[#1C1C1E]">
              ₱{surplusPrice.toFixed(2)}
            </span>
          </div>
          
          {action ? (
            <ReserveButton action={action} disabled={availableCount <= 0} />
          ) : (
            <button 
              disabled={availableCount <= 0}
              className="text-xs font-medium uppercase tracking-widest py-2 px-0 text-[#1C1C1E] border-b border-transparent transition-all duration-300 group-hover:border-[#1C1C1E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availableCount <= 0 ? "Out of Stock" : "Reserve"}
            </button>
          )}
        </div>
      </div>

      <DropDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={{ title, merchant, originalPrice, surplusPrice, imageUrl, availableCount }}
        action={action}
      />
    </motion.div>
  );
}
