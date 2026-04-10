"use client";

import React, { useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// We define a custom minimalist dark icon to match the aesthetic.
const customIcon = L.divIcon({
  className: "bg-transparent",
  html: `
    <div class="flex flex-col items-center">
      <div class="w-4 h-4 bg-[#1C1C1E] border-2 border-[#FAF9F6] rounded-full shadow-[0_4px_12px_rgba(28,28,30,0.5)] z-10"></div>
      <div class="w-px h-6 bg-[linear-gradient(to_bottom,#1C1C1E,transparent)]"></div>
    </div>
  `,
  iconSize: [20, 40],
  iconAnchor: [10, 40],
});

interface LuxuryMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  interactive?: boolean;
  onMarkerDragEnd?: (lat: number, lng: number) => void;
}

export default function LuxuryMapInner({
  latitude,
  longitude,
  zoom = 14,
  interactive = false,
  onMarkerDragEnd,
}: LuxuryMapProps) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          onMarkerDragEnd?.(lat, lng);
        }
      },
    }),
    [onMarkerDragEnd]
  );

  return (
    <div className="w-full h-full relative group">
      {/* 
        We use CartoDB Positron (light_all) to ensure a monochromatic/pastel mapping aesthetic 
        that perfectly matches our luxury dirty white background.
      */}
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={false}
        attributionControl={interactive}
        style={{ width: "100%", height: "100%", background: "#FAF9F6", zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Marker 
          position={[latitude, longitude]} 
          icon={customIcon} 
          draggable={!!onMarkerDragEnd}
          eventHandlers={eventHandlers}
          ref={markerRef}
        />
        {interactive && <ZoomControl position="bottomright" />}
      </MapContainer>

      {/* Aesthetic Border Gradients */}
      <div className="absolute inset-0 pointer-events-none border border-[#1C1C1E]/10 z-1000" />
    </div>
  );
}
