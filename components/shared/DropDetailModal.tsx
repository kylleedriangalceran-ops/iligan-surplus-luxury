"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ReserveButton } from "./ReserveButton";
import { openChatWith } from "./FloatingChatWidget";
import { LuxuryMap } from "./LuxuryMap";

interface DropDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    title: string;
    merchantId?: string;
    merchant: string;
    originalPrice: number;
    surplusPrice: number;
    imageUrl?: string | null;
    availableCount: number;
    latitude?: number | null;
    longitude?: number | null;
    hasReserved?: boolean;
  };
  action?: (formData: FormData) => void;
}

export function DropDetailModal({ isOpen, onClose, item, action }: DropDetailModalProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-[#1C1C1E]/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="bg-[#FAF9F6] w-full max-w-2xl overflow-hidden pointer-events-auto border border-[#1C1C1E]/10 shadow-[0_20px_60px_rgb(0,0,0,0.1)]"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex flex-col md:flex-row h-full max-h-[85vh] md:max-h-[600px]">
                
                {/* Image Section */}
                <div className="relative w-full md:w-1/2 aspect-[4/5] md:aspect-auto bg-[#1C1C1E]/5">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#1C1C1E]/30 text-xs uppercase tracking-widest font-light">
                        No Image
                      </span>
                    </div>
                  )}
                  
                  {/* Close button (mobile overlaid) */}
                  <button
                    onClick={onClose}
                    className="md:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#FAF9F6]/80 backdrop-blur-md rounded-full text-[#1C1C1E]"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Content Section */}
                <div className="relative flex flex-col w-full md:w-1/2 p-6 md:p-10 overflow-y-auto">
                  {/* Close button (desktop) */}
                  <button
                    onClick={onClose}
                    className="hidden md:flex absolute top-6 right-6 w-8 h-8 items-center justify-center text-[#1C1C1E]/40 hover:text-[#1C1C1E] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  <div className="mt-auto md:mt-0 flex-1">
                    <div className="mb-8">
                      <span className="inline-block px-3 py-1 bg-[#1C1C1E]/5 border border-[#1C1C1E]/10 text-[10px] uppercase tracking-wider font-semibold text-[#1C1C1E] mb-4">
                        {item.availableCount} Available
                      </span>
                      
                      <h2 className="text-2xl font-light tracking-tight text-[#1C1C1E] mb-2 leading-tight">
                        {item.title}
                      </h2>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#1C1C1E]/10 overflow-hidden relative">
                          <Image src="/pattern.svg" alt="Avatar" fill className="opacity-50 object-cover" />
                        </div>
                        <p className="text-xs uppercase tracking-widest text-[#1C1C1E]/70 font-medium">
                          {item.merchant}
                        </p>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-[#1C1C1E]">★</span>
                          <span className="font-semibold text-[#1C1C1E]">4.8</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 mb-10">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/40 font-semibold mb-2">Description</h4>
                        <p className="text-sm text-[#1C1C1E]/70 leading-relaxed font-light">
                          Perfectly crafted and freshly prepared today. Quality surplus reserved exclusively for our members. Please ensure you can pick up during the designated window.
                        </p>
                      </div>
                      
                      <div className="flex justify-between py-4 border-y border-[#1C1C1E]/10">
                        <div>
                          <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/40 font-semibold mb-1">Original Value</h4>
                          <p className="text-sm line-through text-[#1C1C1E]/50">₱{item.originalPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/40 font-semibold mb-1">Surplus Price</h4>
                          <p className="text-xl font-medium tracking-tight text-[#1C1C1E]">₱{item.surplusPrice.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Map Display */}
                      {item.latitude && item.longitude && (
                        <div className="pt-2">
                           <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/40 font-semibold mb-3">Pickup Location</h4>
                           <div className="w-full h-[180px] bg-[#1C1C1E]/5 border border-[#1C1C1E]/10 flex-shrink-0">
                             <LuxuryMap latitude={item.latitude} longitude={item.longitude} />
                           </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-6 relative flex flex-col gap-3">
                     {action ? (
                        <div className="w-full shrink-0" onClick={onClose}>
                          <ReserveButton action={action} disabled={item.availableCount <= 0} hasReserved={item.hasReserved} fullWidth />
                        </div>
                      ) : (
                        <button 
                          disabled={item.availableCount <= 0 || item.hasReserved}
                          className="w-full text-xs font-medium uppercase tracking-[0.25em] py-4 px-6 bg-[#1C1C1E] text-[#FAF9F6] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {item.hasReserved ? "Reserved" : item.availableCount <= 0 ? "Out of Stock" : "Reserve Now"}
                        </button>
                      )}
                      
                      {/* Message Merchant Trigger */}
                      {item.merchantId && (
                        <button
                          onClick={() => {
                            if (item.merchantId) {
                                openChatWith(item.merchantId, item.merchant);
                                onClose();
                            }
                          }}
                          className="w-full text-[10px] font-semibold uppercase tracking-[0.2em] py-4 px-6 border border-[#1C1C1E]/20 text-[#1C1C1E] transition-all hover:bg-[#1C1C1E]/5 flex items-center justify-center gap-2"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Message Merchant
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
