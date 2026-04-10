"use client";

import React, { useActionState, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { createStoreAction } from "@/app/actions/merchant";
import { LuxuryMap } from "@/components/shared/LuxuryMap";

export function StoreOnboardingForm() {
  const [state, formAction, isPending] = useActionState(createStoreAction, null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const fetchLocation = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!navigator.geolocation) return;
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
      }
    );
  }, []);

  if (state?.success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border border-border/40 bg-card p-12 text-center"
      >
        <p className="text-sm uppercase tracking-widest text-foreground font-medium mb-2">
          Store Created
        </p>
        <p className="text-xs text-muted-foreground">
          Refreshing your dashboard...
        </p>
        <script dangerouslySetInnerHTML={{ __html: "setTimeout(() => window.location.reload(), 1000)" }} />
      </motion.div>
    );
  }

  return (
    <motion.form
      action={formAction}
      className="space-y-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Hidden Fields for Server Action */}
      {coords && (
        <>
          <input type="hidden" name="latitude" value={coords.lat} />
          <input type="hidden" name="longitude" value={coords.lng} />
        </>
      )}

      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
        >
          Store Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full bg-transparent border-0 border-b border-foreground/20 text-foreground py-3 text-sm focus:ring-0 focus:border-foreground/80 focus:outline-none transition-colors rounded-none placeholder:text-muted-foreground/30"
          placeholder="e.g., The Artisan Bakery"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="location"
          className="block text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
        >
          Barangay / Location in Iligan
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          className="w-full bg-transparent border-0 border-b border-foreground/20 text-foreground py-3 text-sm focus:ring-0 focus:border-foreground/80 focus:outline-none transition-colors rounded-none placeholder:text-muted-foreground/30"
          placeholder="e.g., Brgy. Pala-o, Iligan City"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Exact Location
          </label>
          <button
            onClick={fetchLocation}
            disabled={isLocating}
            className="text-[10px] uppercase tracking-widest text-[#1C1C1E] underline decoration-[#1C1C1E]/30 hover:decoration-[#1C1C1E] transition-all"
          >
            {isLocating ? "Locating..." : coords ? "Update Target" : "Use Current Location"}
          </button>
        </div>
        
        {coords ? (
          <div className="space-y-2">
            <div className="w-full h-[200px] bg-[#1C1C1E]/5 relative z-0">
              <LuxuryMap 
                latitude={coords.lat} 
                longitude={coords.lng} 
                interactive 
                onMarkerDragEnd={(lat, lng) => setCoords({ lat, lng })}
              />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-medium text-center">
              You can drag the pin to adjust your precise location
            </p>
          </div>

        ) : (
          <div className="w-full h-[120px] bg-[#1C1C1E]/5 border border-[#1C1C1E]/10 flex flex-col items-center justify-center text-center px-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#1C1C1E]/30 mb-2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
            </svg>
            <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 max-w-[200px]">
              Tap above to grant coordinate pinging for drop discovery
            </p>
          </div>
        )}
      </div>

      {state?.error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center font-medium text-destructive tracking-wide"
        >
          {state.error}
        </motion.p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full group relative flex items-center justify-center p-4 disabled:opacity-50 overflow-hidden"
      >
        <div className="absolute inset-0 bg-foreground transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
        <span className="relative text-background text-xs uppercase tracking-[0.25em] font-medium z-10">
          {isPending ? "Creating..." : "Create Store"}
        </span>
      </button>
    </motion.form>
  );
}
