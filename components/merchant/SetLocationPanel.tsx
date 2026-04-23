"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { ActionButton } from "@/components/shared/ActionButton";

const MapPicker = dynamic(
  () => import("./MapPicker"),
  { ssr: false }
);

interface SetLocationPanelProps {
  currentLat?: number | null;
  currentLng?: number | null;
  storeName: string;
  onSave: (lat: number, lng: number) => Promise<boolean>;
}

const ILIGAN_CENTER: [number, number] = [8.2280, 124.2452];

export function SetLocationPanel({ currentLat, currentLng, storeName, onSave }: SetLocationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [position, setPosition] = useState<[number, number]>(
    currentLat && currentLng ? [currentLat, currentLng] : ILIGAN_CENTER
  );
  // Leaflet is handled completely inside MapPicker now

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await onSave(position[0], position[1]);
      if (saved) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Failed to save location:", error);
    } finally {
      setIsSaving(false);
    }
  };


  const hasLocation = currentLat && currentLng;

  return (
    <>
      {/* Trigger Button */}
      <ActionButton
        onClick={() => setIsOpen(true)}
        variant={hasLocation ? "outline" : "warning"}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        }
      >
        {hasLocation ? "Edit Location" : "Set Location"}
      </ActionButton>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#1C1C1E]/20 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#FAF9F6] shadow-2xl z-50 overflow-y-auto border-l border-[#1C1C1E]/10"
            >
              <div className="p-8 md:p-12 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-light tracking-widest uppercase mb-2">Set Store Location</h2>
                    <p className="text-xs text-[#1C1C1E]/60 uppercase tracking-widest">{storeName}</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    disabled={isSaving}
                    className="text-xs uppercase tracking-widest text-[#1C1C1E]/60 hover:text-[#1C1C1E] transition-colors"
                  >
                    Close
                  </button>
                </div>

                <div className="mb-6 p-4 bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 rounded-md">
                  <p className="text-xs text-[#1C1C1E]/70 leading-relaxed">
                    Click or drag the marker to set your store&apos;s exact location. This will be visible to customers on the map.
                  </p>
                </div>

                {/* Map Container */}
                <div className="flex-1 border border-[#1C1C1E]/10 rounded-md overflow-hidden mb-6" style={{ minHeight: "400px" }}>
                  <MapPicker position={position} setPosition={setPosition} />
                </div>

                {/* Coordinates Display */}
                <div className="mb-6 p-4 bg-white border border-[#1C1C1E]/10 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60">Coordinates</span>
                    <span className="text-xs font-mono text-[#1C1C1E]">
                      {position[0].toFixed(6)}, {position[1].toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    disabled={isSaving}
                    className="flex-1 px-6 py-4 border border-[#1C1C1E]/20 rounded-md text-[#1C1C1E] text-xs uppercase tracking-widest font-semibold hover:bg-[#1C1C1E]/5 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 px-6 py-4 border border-[#1C1C1E] rounded-md bg-[#1C1C1E] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#1C1C1E]/90 transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Location"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
