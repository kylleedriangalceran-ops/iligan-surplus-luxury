"use client";

import React, { useState, useCallback, useMemo } from "react";
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

export function SplitMapClient({ merchants, followedStoreIds }: SplitMapClientProps) {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<FilterMode>("ALL");
  const [userPin, setUserPin] = useState<{ pin: [number, number] | null; radius: number }>({ pin: null, radius: 1 });
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);

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
    setSelectedLocation([lat, lng]);
  };

  const handlePinChange = useCallback((pin: [number, number] | null, radius: number) => {
    setUserPin({ pin, radius });
    if (pin && nearbyMerchants.length > 0) {
      setShowNearbyOnly(true);
    } else if (!pin) {
      setShowNearbyOnly(false);
    }
  }, [nearbyMerchants.length]);

  const handleGoBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to feed page if no history
      router.push('/feed');
    }
  };

  return (
    <>
      {/* Top Bar */}
      <div className="shrink-0 flex items-center px-6 py-4 border-b border-[#1C1C1E]/10 bg-[#FAF9F6] w-full h-16 z-20 animate-in fade-in slide-in-from-top duration-500">
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
          <p className="text-[9px] uppercase tracking-widest text-[#1C1C1E]/40 mt-0.5 text-right">
            Merchant Discovery
          </p>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex flex-row w-full min-h-0 overflow-hidden bg-[#FAF9F6]">
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
          {/* Integrated Filter Bar */}
          <div className="p-4 border-b border-[#1C1C1E]/10 bg-white shrink-0">
            <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
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
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-200 text-[9px] uppercase tracking-widest font-semibold",
                  showNearbyOnly
                    ? "bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white border-[#3B82F6]/30"
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
          
          <div className="flex-1 overflow-y-auto p-6 bg-[#FAF9F6]">
            {/* Shops You Follow */}
            {followedStores.length > 0 && (
              <div className="mb-8">
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
      className="text-left w-full p-4 border border-[#1C1C1E]/5 bg-white hover:border-[#1C1C1E]/20 hover:shadow-md transition-all duration-200 group rounded-lg"
    >
      <div className="flex items-start justify-between mb-2">
        <p className={cn(
          "text-[11px] font-bold uppercase tracking-widest transition-colors",
          isFollowed 
            ? "text-[#1C1C1E] group-hover:text-[#D4AF37]" 
            : "text-[#1C1C1E] group-hover:opacity-70"
        )}>
          {shop.storeName}
        </p>
        {shop.distance !== undefined && (
          <span className="text-[8px] uppercase tracking-wider font-semibold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-1 rounded-full">
            {shop.distance.toFixed(1)}km
          </span>
        )}
      </div>
      
      <p className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/50 mb-2 line-clamp-1">
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
