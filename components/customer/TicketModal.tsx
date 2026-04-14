"use client";

import React, { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  reservationToken: string;
  listingTitle: string;
  storeName: string;
  pickupTimeWindow: string;
}

export function TicketModal({
  isOpen,
  onClose,
  reservationId,
  reservationToken,
  listingTitle,
  storeName,
  pickupTimeWindow,
}: TicketModalProps) {
  
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1C1C1E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6"
          >
            {/* Modal Content - High End Ticket */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()} // Prevent click-through
              className="relative w-full max-w-[340px] bg-[#1C1C1E] border border-amber-500/30 overflow-hidden shadow-2xl"
            >
              {/* Gold borders styling */}
              <div className="absolute inset-0 border-[1px] border-amber-500/20 m-2 pointer-events-none" />
              <div className="absolute inset-0 border-[1px] border-amber-500/10 m-3 pointer-events-none" />

              <div className="p-8 pb-10 flex flex-col items-center text-center relative z-10">
                {/* Header */}
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-amber-500/80 font-medium mb-1">
                  Pick-up Pass
                </h3>
                <h2 className="text-xl font-light text-[#FAF9F6] tracking-wide mb-8">
                  {listingTitle}
                </h2>

                {/* QR Code Container */}
                <div className="bg-white p-4 mb-8">
                  <QRCodeSVG
                    value={reservationId}
                    size={180}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"H"}
                    includeMargin={false}
                  />
                </div>

                {/* Ticket Details */}
                <div className="w-full space-y-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#FAF9F6]/40 mb-1">
                      Store
                    </p>
                    <p className="text-xs text-[#FAF9F6] uppercase tracking-wider">
                      {storeName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#FAF9F6]/40 mb-1">
                      Time Window
                    </p>
                    <p className="text-xs text-[#FAF9F6] uppercase tracking-wider">
                      {pickupTimeWindow}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#FAF9F6]/40 mb-1">
                      Token
                    </p>
                    <p className="text-lg font-mono tracking-[0.2em] text-amber-500">
                      {reservationToken}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="mt-10 px-6 py-3 border border-[#FAF9F6]/20 text-[#FAF9F6] text-[10px] uppercase tracking-widest hover:bg-[#FAF9F6]/10 transition-colors"
                >
                  Close Pass
                </button>
              </div>

              {/* Ticket Cutouts */}
              <div className="absolute top-1/2 -left-4 w-8 h-8 bg-black rounded-full transform -translate-y-1/2 border-r border-amber-500/30" />
              <div className="absolute top-1/2 -right-4 w-8 h-8 bg-black rounded-full transform -translate-y-1/2 border-l border-amber-500/30" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
