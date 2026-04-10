"use client";

import React from "react";
import dynamic from "next/dynamic";

interface LuxuryMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  interactive?: boolean;
  onMarkerDragEnd?: (lat: number, lng: number) => void;
}

const LuxuryMapInner = dynamic(
  () => import("./LuxuryMapInner"),
  { 
    ssr: false, 
    loading: () => <div className="w-full h-full bg-[#1C1C1E]/5 animate-pulse" /> 
  }
);

export function LuxuryMap({
  latitude,
  longitude,
  zoom,
  interactive,
  onMarkerDragEnd,
}: LuxuryMapProps) {
  // Graceful degradation if coordinates are missing somehow
  if (!latitude || !longitude) {
    return (
      <div className="w-full h-full bg-[#1C1C1E]/5 flex items-center justify-center text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-mono">
        Location Unavailable
      </div>
    );
  }

  return (
    <LuxuryMapInner 
      latitude={latitude} 
      longitude={longitude} 
      zoom={zoom} 
      interactive={interactive} 
      onMarkerDragEnd={onMarkerDragEnd}
    />
  );
}
