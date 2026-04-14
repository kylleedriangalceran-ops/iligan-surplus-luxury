"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, Marker, Tooltip, ZoomControl, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMerchant } from "@/app/actions/map";
import { cn } from "@/lib/utils";

// ─── Iligan City Configuration ──────────────────────────────────
const ILIGAN_CENTER: [number, number] = [8.2280, 124.2452];

const ILIGAN_BOUNDS: L.LatLngBoundsExpression = [
  [8.175, 124.190], // SW corner
  [8.280, 124.300], // NE corner  
];

// ─── Custom Pin Icons ──────────────────────────────────────────

// Standard pin (dark, minimalist)
const standardPinIcon = L.divIcon({
  className: "bg-transparent",
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="width:14px;height:14px;background:#1C1C1E;border:2px solid #FAF9F6;border-radius:50%;box-shadow:0 3px 12px rgba(28,28,30,0.5);"></div>
      <div style="width:1.5px;height:16px;background:linear-gradient(to bottom,#1C1C1E,transparent);"></div>
    </div>
  `,
  iconSize: [18, 30],
  iconAnchor: [9, 30],
  tooltipAnchor: [0, -32],
});

// Followed shop pin (distinct gold look)
const followedPinIcon = L.divIcon({
  className: "bg-transparent",
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:20px;height:20px;background:#D4AF37;border:2px solid #FAF9F6;border-radius:50%;box-shadow:0 4px 16px rgba(212,175,55,0.6);">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FAF9F6">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </div>
      <div style="width:1.5px;height:18px;background:linear-gradient(to bottom,#D4AF37,transparent);"></div>
    </div>
  `,
  iconSize: [24, 38],
  iconAnchor: [12, 38],
  tooltipAnchor: [0, -40],
});

// User's draggable pin - simple and visible
const userPinIcon = L.divIcon({
  className: "bg-transparent",
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:move;">
      <style>
        @keyframes pinDrop {
          0% { transform: translateY(-100px) scale(0.5); opacity: 0; }
          50% { transform: translateY(10px) scale(1.1); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes pinPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
      </style>
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
        <!-- Ripple effect -->
        <div style="position:absolute;width:100%;height:100%;background:#0EA5E9;border-radius:50%;animation:ripple 2s infinite;"></div>
        <!-- Main pin -->
        <div style="position:relative;width:28px;height:28px;background:#0EA5E9;border:3px solid #FFFFFF;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(14,165,233,0.5);animation:pinPulse 2s infinite;">
        </div>
      </div>
      <div style="width:3px;height:24px;background:linear-gradient(to bottom,#0EA5E9,transparent);"></div>
    </div>
  `,
  iconSize: [32, 56],
  iconAnchor: [16, 56],
  tooltipAnchor: [0, -58],
});

// ─── Layer Definitions ──────────────────────────────────────────
type LayerType = "standard" | "satellite" | "terrain";

const TILE_LAYERS: Record<LayerType, { url: string; attribution: string; label: string }> = {
  standard: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    label: "Standard",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    label: "Satellite",
  },
  terrain: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    label: "Terrain",
  },
};

// ─── Utility Components ─────────────────────────────────────────

// MapController listens to centerLocation changes and flies the map to it
function MapController({ centerLocation }: { centerLocation: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (centerLocation) {
      map.flyTo(centerLocation, 16, { animate: true, duration: 1.5 });
    }
  }, [centerLocation, map]);
  return null;
}

// TileLayerSwitcher changes map tiles smoothly
function TileLayerSwitcher({ layer }: { layer: LayerType }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    const tl = L.tileLayer(TILE_LAYERS[layer].url, {
      attribution: TILE_LAYERS[layer].attribution,
    });
    tl.addTo(map);
    layerRef.current = tl;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [layer, map]);

  return null;
}

// MapRefSetter to get map instance
function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

// ─── Helper Functions ───────────────────────────────────────────

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Main Component ─────────────────────────────────────────────
interface DynamicMapProps {
  merchants: MapMerchant[];
  followedStoreIds: string[];
  centerLocation: [number, number] | null;
  onPinChange?: (pin: [number, number] | null, radius: number) => void;
}

export default function DynamicMap({ merchants, followedStoreIds, centerLocation, onPinChange }: DynamicMapProps) {
  const [layer, setLayer] = useState<LayerType>("standard");
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [userPin, setUserPin] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchRadius, setSearchRadius] = useState(1); // km
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const userMarkerRef = useRef<L.Marker>(null);
  const mapRef = useRef<L.Map | null>(null);
  const dragButtonRef = useRef<HTMLDivElement>(null);

  // Filter merchants based on search query (only registered merchants with locations)
  const filteredMerchants = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    // Search only in registered merchants who have set their location
    return merchants
      .filter(m => 
        m.storeName.toLowerCase().includes(query) ||
        m.location.toLowerCase().includes(query)
      )
      .slice(0, 8) // Show up to 8 results
      .map(m => ({
        storeId: m.storeId,
        storeName: m.storeName,
        location: m.location,
        lat: m.latitude,
        lng: m.longitude,
        activeDrops: m.activeDrops,
      }));
  }, [searchQuery, merchants]);

  // Calculate nearby merchants using useMemo
  const nearbyMerchants = useMemo(() => {
    if (!userPin) return [];
    
    return merchants
      .map(merchant => ({
        ...merchant,
        distance: calculateDistance(userPin[0], userPin[1], merchant.latitude, merchant.longitude)
      }))
      .filter(m => m.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance);
  }, [userPin, merchants, searchRadius]);

  // Handle drag and drop of pin button
  const handleDragStart = (e: React.DragEvent) => {
    setIsDraggingButton(true);
    e.dataTransfer.effectAllowed = 'move';
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.innerHTML = '📍';
    dragImage.style.fontSize = '32px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 16, 32);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setIsDraggingButton(false);
  };

  const handleMapDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!mapRef.current) return;

    const mapContainer = mapRef.current.getContainer();
    const rect = mapContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const point = mapRef.current.containerPointToLatLng([x, y]);
    const newPin: [number, number] = [point.lat, point.lng];
    setUserPin(newPin);
    onPinChange?.(newPin, searchRadius);
  };

  const handleMapDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSearchSelect = (storeId: string, lat: number, lng: number) => {
    const newPin: [number, number] = [lat, lng];
    setUserPin(newPin);
    onPinChange?.(newPin, searchRadius);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const userMarkerHandlers = useMemo(
    () => ({
      dragstart() {
        setIsDragging(true);
      },
      dragend() {
        const marker = userMarkerRef.current;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          const newPin: [number, number] = [lat, lng];
          setUserPin(newPin);
          setIsDragging(false);
          onPinChange?.(newPin, searchRadius);
        }
      },
    }),
    [searchRadius, onPinChange]
  );

  return (
    <div className="relative w-full h-full">
      {/* Search Bar - Top Left with animation */}
      <div className="absolute top-6 left-6 z-[1000] w-80 animate-in fade-in slide-in-from-left duration-500">
        <div className="relative">
          <div className="flex items-center bg-white/95 backdrop-blur-lg border border-[#1C1C1E]/10 rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-xl hover:border-[#1C1C1E]/20">
            <div className="flex items-center justify-center w-12 h-12 text-[#1C1C1E]/40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search registered merchants..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="flex-1 h-12 pr-4 bg-transparent text-sm text-[#1C1C1E] placeholder:text-[#1C1C1E]/40 outline-none"
            />
          </div>

          {/* Search Suggestions - Only Registered Merchants */}
          {showSuggestions && filteredMerchants.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg border border-[#1C1C1E]/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {filteredMerchants.map((merchant) => (
                <button
                  key={merchant.storeId}
                  onClick={() => handleSearchSelect(merchant.storeId, merchant.lat, merchant.lng)}
                  className="w-full px-4 py-3 text-left hover:bg-[#1C1C1E]/5 transition-colors border-b border-[#1C1C1E]/5 last:border-0 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1C1C1E] truncate group-hover:text-[#0EA5E9] transition-colors">
                        {merchant.storeName}
                      </p>
                      <p className="text-xs text-[#1C1C1E]/50 mt-0.5 truncate">
                        📍 {merchant.location}
                      </p>
                      {merchant.activeDrops > 0 && (
                        <p className="text-[10px] text-emerald-600 font-medium mt-1">
                          {merchant.activeDrops} active {merchant.activeDrops === 1 ? 'drop' : 'drops'}
                        </p>
                      )}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1C1C1E]/20 group-hover:text-[#0EA5E9] group-hover:translate-x-1 transition-all">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {showSuggestions && searchQuery.trim() && filteredMerchants.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg border border-[#1C1C1E]/10 rounded-lg shadow-xl p-6 text-center animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1C1C1E]/5 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1C1C1E]/40">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1C1C1E] mb-1">
                No merchants found
              </p>
              <p className="text-xs text-[#1C1C1E]/50">
                Try searching with a different keyword
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Leaflet Map */}
      <div 
        className="w-full h-full"
        onDrop={handleMapDrop}
        onDragOver={handleMapDragOver}
        style={{ cursor: isDraggingButton ? 'pointer' : 'default' }}
      >
        <MapContainer
          center={ILIGAN_CENTER}
          zoom={14}
          minZoom={13}
          maxZoom={18}
          maxBounds={ILIGAN_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={true}
          zoomControl={false}
          attributionControl={false}
          style={{ width: "100%", height: "100%", background: "#FAF9F6" }}
        >
          <MapController centerLocation={centerLocation} />
          <TileLayerSwitcher layer={layer} />
          <MapRefSetter mapRef={mapRef} />
          <ZoomControl position="bottomright" />

        {/* Merchant Pins */}
        {merchants.map((merchant) => {
          const isFollowed = followedStoreIds.includes(merchant.storeId);
          return (
            <Marker
              key={merchant.storeId}
              position={[merchant.latitude, merchant.longitude]}
              icon={isFollowed ? followedPinIcon : standardPinIcon}
            >
              <Tooltip
                direction="top"
                offset={[0, isFollowed ? -4 : -4]}
                opacity={1}
                className="luxury-map-tooltip"
                sticky={false}
              >
                <div className="min-w-[190px]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={cn(
                      "text-[11px] uppercase tracking-[0.15em] font-bold",
                      isFollowed ? "text-[#D4AF37]" : "text-[#1C1C1E]"
                    )}>
                      {merchant.storeName}
                    </h4>
                    {isFollowed ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[#D4AF37] shrink-0">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ) : null}
                  </div>
                  <p className="text-[9px] text-[#1C1C1E]/50 tracking-wider uppercase mb-2.5 leading-relaxed">
                    📍 {merchant.location}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#1C1C1E]/8">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      merchant.activeDrops > 0 ? (isFollowed ? "text-[#D4AF37]" : "text-[#1C1C1E]") : "text-[#1C1C1E]/30"
                    )}>
                      {merchant.activeDrops > 0
                        ? `${merchant.activeDrops} Available`
                        : "No Drops"}
                    </span>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Draggable User Pin with Search Radius */}
        {userPin && (
          <>
            {/* Search radius circle */}
            <Circle
              center={userPin}
              radius={searchRadius * 1000} // Convert km to meters
              pathOptions={{
                color: '#0EA5E9',
                fillColor: '#0EA5E9',
                fillOpacity: 0.1,
                weight: 2,
                opacity: 0.4,
                dashArray: '5, 10',
              }}
            />
            
            <Marker
              position={userPin}
              icon={userPinIcon}
              draggable={true}
              eventHandlers={userMarkerHandlers}
              ref={userMarkerRef}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -8]} 
                opacity={1} 
                className="luxury-map-tooltip"
                permanent={isDragging}
              >
                <div className="min-w-[160px]">
                  <h4 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#0EA5E9] mb-1.5">
                    📍 Explore Location
                  </h4>
                  <p className="text-[9px] text-[#1C1C1E]/60 tracking-wider uppercase mb-1">
                    {nearbyMerchants.length} {nearbyMerchants.length === 1 ? 'merchant' : 'merchants'} nearby
                  </p>
                  <p className="text-[8px] text-[#1C1C1E]/40 tracking-wider uppercase">
                    Drag to explore • {searchRadius}km radius
                  </p>
                </div>
              </Tooltip>
            </Marker>
          </>
        )}
        </MapContainer>
      </div>

      {/* ─── Floating Controls ─── */}

      {/* Layer Switcher — Top Right */}
      <div className="absolute top-6 right-5 z-[1000] flex flex-col gap-2 items-end animate-in fade-in slide-in-from-right duration-500">
        <button
          onClick={() => setLayerMenuOpen((p) => !p)}
          className="bg-[#FAF9F6]/95 backdrop-blur-lg border border-[#1C1C1E]/10 shadow-lg p-2.5 rounded-lg hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center w-10 h-10"
          aria-label="Switch map layer"
          title="Map Style"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-opacity", layerMenuOpen ? "opacity-100" : "opacity-60")}>
            <path d="m12 2 10 6.5v7L12 22 2 15.5v-7L12 2Z" />
            <path d="m12 22v-7" />
            <path d="m22 8.5-10 7-10-7" />
            <path d="m2 15.5 10-7 10 7" />
          </svg>
        </button>

        {layerMenuOpen && (
          <div className="bg-[#FAF9F6]/95 backdrop-blur-lg border border-[#1C1C1E]/10 shadow-xl rounded-sm overflow-hidden min-w-[140px] mt-1">
            {(Object.keys(TILE_LAYERS) as LayerType[]).map((key) => (
              <button
                key={key}
                onClick={() => { setLayer(key); setLayerMenuOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-colors border-b border-[#1C1C1E]/5 last:border-0",
                  layer === key
                    ? "bg-[#1C1C1E] text-[#FAF9F6]"
                    : "text-[#1C1C1E]/60 hover:text-[#1C1C1E] hover:bg-[#1C1C1E]/5"
                )}
              >
                {TILE_LAYERS[key].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Drop Pin & Controls — Bottom Center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-3">
        {/* Nearby Merchants Info (when pin is active) */}
        {userPin && nearbyMerchants.length > 0 && (
          <div className="bg-white/95 backdrop-blur-lg border border-[#1C1C1E]/10 shadow-xl rounded-lg px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]">
                  {nearbyMerchants.length} {nearbyMerchants.length === 1 ? 'Merchant' : 'Merchants'} Found
                </p>
              </div>
              <div className="h-4 w-px bg-[#1C1C1E]/10" />
              <p className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/50 font-medium">
                Within {searchRadius}km
              </p>
            </div>
          </div>
        )}

        {/* Main Controls */}
        <div className="flex items-center gap-3">
          {/* Merchant Count Badge */}
          <div className="bg-[#1C1C1E]/95 backdrop-blur-sm text-[#FAF9F6] px-4 py-2.5 rounded-lg shadow-lg border border-[#FAF9F6]/10">
            <p className="text-[10px] uppercase tracking-widest font-semibold">
              {merchants.length} {merchants.length === 1 ? "Merchant" : "Merchants"}
            </p>
          </div>

          {/* Draggable Drop Pin Button */}
          <div
            ref={dragButtonRef}
            draggable={!userPin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-lg shadow-lg transition-all duration-200 text-[10px] uppercase tracking-widest font-semibold border select-none",
              userPin
                ? "bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white border-[#0EA5E9]/30 cursor-default"
                : isDraggingButton
                ? "bg-[#0EA5E9]/20 text-[#0EA5E9] border-[#0EA5E9]/30 scale-95 cursor-grabbing"
                : "bg-white/95 backdrop-blur-lg text-[#1C1C1E] border-[#1C1C1E]/10 hover:bg-white hover:border-[#1C1C1E]/20 cursor-grab hover:scale-105"
            )}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={cn("transition-transform", (userPin || isDraggingButton) && "scale-110")}
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {userPin ? "Pin Dropped" : isDraggingButton ? "Drop on Map" : "Drag Pin to Map"}
          </div>

          {/* Radius Adjuster (when pin is active) */}
          {userPin && (
            <div className="bg-white/95 backdrop-blur-lg border border-[#1C1C1E]/10 rounded-lg px-4 py-2.5 shadow-lg animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="flex items-center gap-3">
                <label className="text-[9px] uppercase tracking-widest font-semibold text-[#1C1C1E]/60">
                  Radius
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newRadius = Math.max(0.5, searchRadius - 0.5);
                      setSearchRadius(newRadius);
                      if (userPin) onPinChange?.(userPin, newRadius);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded border border-[#1C1C1E]/20 hover:bg-[#1C1C1E]/5 transition-colors"
                    disabled={searchRadius <= 0.5}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="text-[11px] font-bold text-[#1C1C1E] min-w-[40px] text-center">
                    {searchRadius}km
                  </span>
                  <button
                    onClick={() => {
                      const newRadius = Math.min(5, searchRadius + 0.5);
                      setSearchRadius(newRadius);
                      if (userPin) onPinChange?.(userPin, newRadius);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded border border-[#1C1C1E]/20 hover:bg-[#1C1C1E]/5 transition-colors"
                    disabled={searchRadius >= 5}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
