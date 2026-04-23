"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { type MapMerchant } from "@/app/actions/map";
import { cn } from "@/lib/utils";

const DynamicMap = dynamic(() => import("./DynamicMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#FAF9F6] flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-3 border-[#1C1C1E]/10 border-t-[#1C1C1E] rounded-full animate-spin" />
      <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-semibold mt-4">
        Loading Map...
      </p>
    </div>
  ),
});

interface SplitMapClientProps {
  merchants: MapMerchant[];
  followedStoreIds: string[];
}

export type FilterMode = "ALL" | "ACTIVE" | "INACTIVE";

/* ─── Bottom Sheet Snap Points (mobile) ─── */
const SHEET_PEEK = 72;       // Just the handle + title visible
const SHEET_HALF_RATIO = 0.45; // 45% of viewport
const SHEET_FULL_RATIO = 0.85; // 85% of viewport

export function SplitMapClient({ merchants, followedStoreIds }: SplitMapClientProps) {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSelected = localStorage.getItem('map:selectedLocation');
        if (savedSelected) {
          const parsed = JSON.parse(savedSelected);
          if (Array.isArray(parsed) && typeof parsed[0] === 'number' && typeof parsed[1] === 'number' && !isNaN(parsed[0]) && !isNaN(parsed[1])) {
            return parsed as [number, number];
          }
        }
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [filter, setFilter] = useState<FilterMode>("ALL");
  const [userPin, setUserPin] = useState<{ pin: [number, number] | null; radius: number }>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUserPin = localStorage.getItem('map:userPin');
        if (savedUserPin) {
          const parsed = JSON.parse(savedUserPin);
          if (parsed && typeof parsed.radius === 'number') {
            if (parsed.pin === null) return parsed;
            if (Array.isArray(parsed.pin) && typeof parsed.pin[0] === 'number' && typeof parsed.pin[1] === 'number' && !isNaN(parsed.pin[0]) && !isNaN(parsed.pin[1])) {
              return parsed;
            }
          }
        }
      } catch {
        // ignore
      }
    }
    return { pin: null, radius: 1 };
  });
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);

  /* ─── Mobile Bottom Sheet State ─── */
  const [sheetHeight, setSheetHeight] = useState(SHEET_PEEK);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const filteredMerchants = merchants.filter((m) => {
    if (filter === "ACTIVE") return m.activeDrops > 0;
    if (filter === "INACTIVE") return m.activeDrops === 0;
    return true;
  });

  // Calculate nearby merchants based on pin location
  const nearbyMerchants: (MapMerchant & { distance: number })[] = useMemo(() => {
    if (!userPin.pin) return [];
    
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return filteredMerchants
      .map(merchant => ({
        ...merchant,
        distance: calculateDistance(userPin.pin![0], userPin.pin![1], merchant.latitude, merchant.longitude)
      }))
      .filter(m => m.distance <= userPin.radius)
      .sort((a, b) => a.distance - b.distance);
  }, [userPin, filteredMerchants]);

  // Show nearby merchants if pin is dropped, otherwise show all
  const displayMerchants: (MapMerchant & { distance?: number })[] = showNearbyOnly && nearbyMerchants.length > 0 
    ? nearbyMerchants 
    : filteredMerchants;

  const followedStores = displayMerchants.filter((m) => followedStoreIds.includes(m.storeId));
  const otherStores = displayMerchants.filter((m) => !followedStoreIds.includes(m.storeId));

  const handleShopClick = (lat: number, lng: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return; // Do nothing if coordinates are invalid
    }
    const newLoc: [number, number] = [lat, lng];
    setSelectedLocation(newLoc);
    if (typeof window !== "undefined") {
      localStorage.setItem('map:selectedLocation', JSON.stringify(newLoc));
    }
    // On mobile, collapse the sheet so user can see the map
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSheetHeight(SHEET_PEEK);
    }
  };

  const handlePinChange = useCallback((pin: [number, number] | null, radius: number) => {
    const newState = { pin, radius };
    setUserPin(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem('map:userPin', JSON.stringify(newState));
    }
    if (pin && nearbyMerchants.length > 0) {
      setShowNearbyOnly(true);
    } else if (!pin) {
      setShowNearbyOnly(false);
    }
  }, [nearbyMerchants.length]);

  // Removed the useEffect that caused cascading renders on mount; 
  // state is now initialized directly inside useState instead.

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed');
    }
  };

  /* ─── Bottom Sheet Drag Handlers ─── */
  const snapToNearest = useCallback((currentHeight: number) => {
    if (typeof window === "undefined") return;
    const vh = window.innerHeight;
    const halfH = vh * SHEET_HALF_RATIO;
    const fullH = vh * SHEET_FULL_RATIO;

    const snapPoints = [SHEET_PEEK, halfH, fullH];
    let closest = snapPoints[0];
    let minDist = Math.abs(currentHeight - closest);
    for (const sp of snapPoints) {
      const dist = Math.abs(currentHeight - sp);
      if (dist < minDist) {
        minDist = dist;
        closest = sp;
      }
    }
    setSheetHeight(closest);
  }, []);

  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDraggingSheet(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = sheetHeight;
  }, [sheetHeight]);

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingSheet) return;
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const newHeight = Math.max(SHEET_PEEK, Math.min(window.innerHeight * SHEET_FULL_RATIO, dragStartHeight.current + deltaY));
    setSheetHeight(newHeight);
  }, [isDraggingSheet]);

  const handleSheetTouchEnd = useCallback(() => {
    setIsDraggingSheet(false);
    snapToNearest(sheetHeight);
  }, [sheetHeight, snapToNearest]);

  // Toggle between peek and half on handle tap
  const handleSheetToggle = useCallback(() => {
    if (typeof window === "undefined") return;
    const halfH = window.innerHeight * SHEET_HALF_RATIO;
    setSheetHeight(sheetHeight <= SHEET_PEEK ? halfH : SHEET_PEEK);
  }, [sheetHeight]);

  /* ─── Filter Bar Component ─── */
  const renderFilterBar = () => (
    <div className="shrink-0 border-b border-[#1C1C1E]/10 bg-white">
      <div className="px-4 pt-4 pb-3">
        {/* Indicator & Location Button Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[9px] uppercase tracking-widest font-extrabold text-[#1C1C1E]">
              {merchants.length} Registered {merchants.length === 1 ? 'Merchant' : 'Merchants'}
            </p>
          </div>
          
          <button 
            onClick={() => {
              if (typeof window !== "undefined") {
                 window.dispatchEvent(new CustomEvent('request-location-tracking'));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9]/20 transition-colors text-[8px] uppercase tracking-widest font-bold"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Track Location
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(["ALL", "ACTIVE", "INACTIVE"] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={cn(
                "text-[9px] uppercase tracking-widest font-semibold px-3 py-2 transition-all duration-200 rounded-lg whitespace-nowrap",
                filter === mode
                  ? "bg-[#1C1C1E] text-[#FAF9F6] shadow-sm"
                  : "text-[#1C1C1E]/50 hover:text-[#1C1C1E] hover:bg-[#1C1C1E]/5"
              )}
            >
              {mode === "ALL" ? "All" : mode === "ACTIVE" ? "Active Drops" : "No Drops"}
            </button>
          ))}
        </div>
        
        {/* Nearby Toggle */}
        {nearbyMerchants.length > 0 && (
          <button
            onClick={() => setShowNearbyOnly(!showNearbyOnly)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-200 text-[9px] uppercase tracking-widest font-semibold mt-2",
              showNearbyOnly
                ? "bg-linear-to-r from-[#3B82F6] to-[#2563EB] text-white border-[#3B82F6]/30"
                : "bg-[#FAF9F6] text-[#1C1C1E]/60 border-[#1C1C1E]/10 hover:border-[#1C1C1E]/20"
            )}
          >
            <span className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {showNearbyOnly ? 'Showing Nearby' : 'Show All'}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[8px] font-bold",
              showNearbyOnly ? "bg-white/20" : "bg-[#3B82F6]/10 text-[#3B82F6]"
            )}>
              {nearbyMerchants.length}
            </span>
          </button>
        )}
      </div>
    </div>
  );

  /* ─── Merchant List Component ─── */
  const renderMerchantList = () => (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#FAF9F6]">
      {/* Shops You Follow */}
      {followedStores.length > 0 && (
        <div className="mb-6 md:mb-8">
          <h4 className="text-[9px] uppercase tracking-widest text-[#1C1C1E] font-bold mb-3 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#D4AF37]">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            Shops You Follow
          </h4>
          <div className="flex flex-col gap-2">
            {followedStores.map((shop) => (
              <ShopCard 
                key={shop.storeId} 
                shop={shop} 
                isFollowed={true}
                onClick={() => handleShopClick(shop.latitude, shop.longitude)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Merchants */}
      <div>
        <h4 className="text-[9px] uppercase tracking-widest text-[#1C1C1E] font-bold mb-3">
          {showNearbyOnly && nearbyMerchants.length > 0 ? 'Nearby Merchants' : 'All Merchants'}
        </h4>
        <div className="flex flex-col gap-2">
          {otherStores.map((shop) => (
            <ShopCard 
              key={shop.storeId} 
              shop={shop} 
              isFollowed={false}
              onClick={() => handleShopClick(shop.latitude, shop.longitude)}
            />
          ))}
          
          {otherStores.length === 0 && (
            <p className="text-[10px] text-[#1C1C1E]/40 uppercase tracking-widest">
              {showNearbyOnly ? 'No nearby merchants found.' : 'No merchants found.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Top Bar */}
      <div className="shrink-0 flex items-center px-4 md:px-6 py-4 border-b border-[#1C1C1E]/10 bg-[#FAF9F6] w-full h-14 md:h-16 z-20 animate-in fade-in slide-in-from-top duration-500">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-[#1C1C1E]/60 hover:text-[#1C1C1E] transition-all hover:gap-3 group"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="text-xs uppercase tracking-widest font-semibold">Go Back</span>
        </button>
        <div className="ml-auto">
          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1C1E] text-right">
            Iligan City
          </h2>
          <p className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/40 mt-0.5 text-right hidden sm:block">
            Merchant Discovery
          </p>
        </div>
      </div>

      {/* ─── Desktop Split Layout (md+) ─── */}
      <div className="hidden md:flex flex-1 flex-row w-full min-h-0 overflow-hidden bg-[#FAF9F6]">
        {/* Left 70%: Map */}
        <div style={{ width: '70%' }} className="h-full relative border-r border-[#1C1C1E]/10 z-10">
          <DynamicMap 
            merchants={filteredMerchants} 
            followedStoreIds={followedStoreIds}
            centerLocation={selectedLocation}
            onPinChange={handlePinChange}
          />
        </div>

        {/* Right 30%: Shops List */}
        <div style={{ width: '30%' }} className="h-full flex flex-col z-10">
          {renderFilterBar()}
          {renderMerchantList()}
        </div>
      </div>

      {/* ─── Mobile Layout (<md) ─── */}
      <div className="flex md:hidden flex-1 flex-col w-full min-h-0 overflow-hidden bg-[#FAF9F6] relative">
        {/* Full-screen Map */}
        <div className="absolute inset-0 z-0">
          <DynamicMap 
            merchants={filteredMerchants} 
            followedStoreIds={followedStoreIds}
            centerLocation={selectedLocation}
            onPinChange={handlePinChange}
          />
        </div>

        {/* Bottom Sheet */}
        <div
          ref={sheetRef}
          className="absolute bottom-0 left-0 right-0 z-30 bg-[#FAF9F6] rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.12)] flex flex-col"
          style={{
            height: `${sheetHeight}px`,
            transition: isDraggingSheet ? 'none' : 'height 0.35s cubic-bezier(0.22,1,0.36,1)',
            maxHeight: '85vh',
          }}
        >
          {/* Drag Handle */}
          <div
            className="shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            onClick={handleSheetToggle}
          >
            <div className="w-10 h-1 rounded-full bg-[#1C1C1E]/15" />
            <div className="flex items-center justify-between w-full px-5 mt-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#1C1C1E]">
                {displayMerchants.length} {displayMerchants.length === 1 ? 'Merchant' : 'Merchants'}
              </p>
              <div className="flex items-center gap-1.5 text-[#1C1C1E]/40">
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={cn(
                    "transition-transform duration-300",
                    sheetHeight > SHEET_PEEK ? "rotate-180" : ""
                  )}
                >
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter + List (only visible when expanded beyond peek) */}
          {sheetHeight > SHEET_PEEK && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
              {renderFilterBar()}
              {renderMerchantList()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Shop Card Component
function ShopCard({ 
  shop, 
  isFollowed, 
  onClick 
}: { 
  shop: MapMerchant & { distance?: number }; 
  isFollowed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full p-3 md:p-4 border border-[#1C1C1E]/5 bg-white hover:border-[#1C1C1E]/20 hover:shadow-md transition-all duration-200 group rounded-lg"
    >
      <div className="flex items-start justify-between mb-1.5 md:mb-2">
        <p className={cn(
          "text-[11px] font-bold uppercase tracking-widest transition-colors leading-tight",
          isFollowed 
            ? "text-[#1C1C1E] group-hover:text-[#D4AF37]" 
            : "text-[#1C1C1E] group-hover:opacity-70"
        )}>
          {shop.storeName}
        </p>
        {shop.distance !== undefined && (
          <span className="text-[8px] uppercase tracking-wider font-semibold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-1 rounded-full shrink-0 ml-2">
            {shop.distance.toFixed(1)}km
          </span>
        )}
      </div>
      
      <p className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/50 mb-1.5 md:mb-2 line-clamp-1">
        📍 {shop.location}
      </p>
      
      <div className="flex items-center justify-between">
        <p className={cn(
          "text-[9px] font-bold uppercase tracking-widest",
          shop.activeDrops > 0 
            ? (isFollowed ? "text-[#D4AF37]" : "text-[#1C1C1E]")
            : "text-[#1C1C1E]/30"
        )}>
          {shop.activeDrops > 0 
            ? `${shop.activeDrops} Available` 
            : 'No Drops'}
        </p>
        
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          className="text-[#1C1C1E]/20 group-hover:text-[#1C1C1E]/60 group-hover:translate-x-1 transition-all"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}
