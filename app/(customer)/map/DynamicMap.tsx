"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { MapContainer, Marker, Tooltip, ZoomControl, useMap, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMerchant } from "@/app/actions/map";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Iligan City Configuration ──────────────────────────────────
const ILIGAN_CENTER: [number, number] = [8.2280, 124.2452];

const PHILIPPINES_BOUNDS: L.LatLngBoundsExpression = [
  [4.5, 116.0],  // SW corner of Philippines
  [21.5, 127.0], // NE corner of Philippines
];

// ─── Custom Pin Icons ──────────────────────────────────────────

// Standard pin (dark, minimalist)
const standardPinIcon = L.divIcon({
  className: "bg-transparent border-none",
  html: `
    <div style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#1C1C1E" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" fill="#ffffff" stroke="none" />
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  tooltipAnchor: [0, -32],
});

// Followed shop pin (distinct gold look)
const followedPinIcon = L.divIcon({
  className: "bg-transparent border-none",
  html: `
    <div style="filter: drop-shadow(0px 6px 8px rgba(212,175,55,0.4));">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#D4AF37" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" fill="#1C1C1E" stroke="none" />
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  tooltipAnchor: [0, -36],
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
    if (
      centerLocation && 
      Array.isArray(centerLocation) &&
      centerLocation.length === 2 &&
      Number.isFinite(centerLocation[0]) && 
      Number.isFinite(centerLocation[1]) &&
      centerLocation[0] >= -90 && centerLocation[0] <= 90 &&
      centerLocation[1] >= -180 && centerLocation[1] <= 180
    ) {
      try {
        map.flyTo(centerLocation, 16, { animate: true, duration: 1.5 });
      } catch (err) {
        console.warn("Leaflet flyTo failed:", err);
      }
    } else if (centerLocation) {
      console.warn("Invalid centerLocation coordinates rejected:", centerLocation);
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

// ─── Routing Component ───────────────────────────────────────────
type RouteMode = "driving" | "walking";

export type RouteInfoType = {
  distance: string;
  duration: string;
  mode: RouteMode;
  setMode: (m: RouteMode) => void;
};

function RoutingMachine({ start, end, onRouteInfo }: { start: [number, number] | null, end: [number, number] | null, onRouteInfo: (info: RouteInfoType | null) => void }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [mode, setModeState] = useState<RouteMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedMode = localStorage.getItem('map:routeMode');
        if (savedMode === 'driving' || savedMode === 'walking') {
          return savedMode as RouteMode;
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    return "driving";
  });

  const setMode = useCallback((newMode: RouteMode) => {
    setModeState(newMode);
    if (typeof window !== "undefined") {
      try { localStorage.setItem('map:routeMode', newMode); } catch {}
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!start || !end) {
      const timer = setTimeout(() => {
        if (mounted) {
          setRouteCoords([]);
          onRouteInfo(null);
        }
      }, 0);
      return () => {
        mounted = false;
        clearTimeout(timer);
      };
    }

    const fetchRoute = async () => {
      try {
        // OSRM expects longitude,latitude. Mode is "driving" (highways) or "walking" (shortcuts/local)
        const res = await fetch(`https://router.project-osrm.org/route/v1/${mode}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
        const data = await res.json();
        
        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];
          // GeoJSON returns [lon, lat], Leaflet Polyline expects [lat, lon]
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
          if (mounted) {
            setRouteCoords(coords);
            
            const distKm = (route.distance / 1000).toFixed(1);
            
            // Apply real-world traffic multipliers
            const trafficMultiplier = mode === "driving" ? 1.4 : 1.1; 
            const durMins = Math.round((route.duration * trafficMultiplier) / 60);
            const durationStr = durMins > 60 ? `${Math.floor(durMins/60)}h ${durMins%60}m` : `${durMins} mins`;
            
            onRouteInfo({ distance: `${distKm} km`, duration: durationStr, mode, setMode });
          }
        }
      } catch (err) {
        console.error("Failed to fetch route:", err);
      }
    };

    fetchRoute();
    
    return () => {
      mounted = false;
    };
  }, [start, end, mode, onRouteInfo, setMode]);

  if (routeCoords.length === 0) return null;

  return (
    <>
      {/* Outer glow/border for the path */}
      <Polyline positions={routeCoords} color={mode === "driving" ? "#D4AF37" : "#1C1C1E"} weight={mode === "driving" ? 8 : 4} opacity={0.3} lineCap="round" lineJoin="round" />
      {/* Inner premium path */}
      <Polyline positions={routeCoords} color="#1C1C1E" weight={mode === "driving" ? 4 : 3} opacity={0.9} lineCap="round" lineJoin="round" dashArray={mode === "walking" ? "5, 10" : undefined} className={mode === "driving" ? "animate-pulse" : ""} />
    </>
  );
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
  const [routeInfo, setRouteInfo] = useState<RouteInfoType | null>(null);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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

  // Handle GPS tracking
  const handleTrackLocation = useCallback(() => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (isNaN(latitude) || isNaN(longitude)) {
            toast.error("Location Error", {
              description: "Your device returned invalid GPS coordinates.",
            });
            setIsLocating(false);
            return;
          }

          const newPin: [number, number] = [latitude, longitude];
          setUserPin(newPin);
          onPinChange?.(newPin, searchRadius);
          setIsLocating(false);
          
          if (mapRef.current) {
            mapRef.current.flyTo(newPin, 16, { animate: true, duration: 1.5 });
          }
        },
        () => {
          toast.error("Location Access Denied", {
            description: "Unable to retrieve your location. Please check your device or browser permissions.",
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error("Unsupported Feature", {
        description: "Geolocation is not supported by your current browser.",
      });
      setIsLocating(false);
    }
  }, [onPinChange, searchRadius]);

  // Listen for external requests to track location (e.g. from the sidebar)
  useEffect(() => {
    const listener = () => handleTrackLocation();
    window.addEventListener('request-location-tracking', listener);
    return () => window.removeEventListener('request-location-tracking', listener);
  }, [handleTrackLocation]);

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
      <div className="absolute top-3 left-3 right-14 md:right-auto md:top-6 md:left-6 z-1000 md:w-80 animate-in fade-in slide-in-from-left duration-500">
        <div className="relative">
          <div className="flex items-center bg-white/95 backdrop-blur-lg border border-[#1C1C1E]/10 rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-xl hover:border-[#1C1C1E]/20 h-10 md:h-auto">
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 text-[#1C1C1E]/40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110 md:w-[18px] md:h-[18px]">
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
              className="flex-1 h-10 md:h-12 pr-4 bg-transparent text-xs md:text-sm text-[#1C1C1E] placeholder:text-[#1C1C1E]/40 outline-none"
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
          minZoom={5}
          maxZoom={18}
          maxBounds={PHILIPPINES_BOUNDS}
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
          
          <RoutingMachine 
            start={userPin} 
            end={
              centerLocation && 
              Array.isArray(centerLocation) && 
              centerLocation.length === 2 && 
              (centerLocation[0] !== userPin?.[0] || centerLocation[1] !== userPin?.[1]) 
                ? centerLocation 
                : null
            } 
            onRouteInfo={setRouteInfo} 
          />

          <ZoomControl position="bottomright" />

        {/* Merchant Pins */}
        {merchants.filter(m => 
          Number.isFinite(m.latitude) && 
          Number.isFinite(m.longitude) && 
          m.latitude >= -90 && m.latitude <= 90 &&
          m.longitude >= -180 && m.longitude <= 180
        ).map((merchant) => {
          const isFollowed = followedStoreIds.includes(merchant.storeId);
          const cleanLocation = merchant.location.replace(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
          return (
            <Marker
              key={merchant.storeId}
              position={[merchant.latitude, merchant.longitude]}
              icon={isFollowed ? followedPinIcon : standardPinIcon}
            >
              <Tooltip
                direction="top"
                offset={[0, -25]}
                opacity={1}
                className="custom-tooltip shadow-2xl rounded-lg border border-[#1C1C1E]/10 bg-white"
              >
                <div className="flex flex-col min-w-[140px] px-1 py-0.5">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <p className="text-[11px] uppercase tracking-widest font-extrabold text-[#1C1C1E] truncate max-w-[150px]">
                      {merchant.storeName}
                    </p>
                    {isFollowed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#D4AF37] shrink-0">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[#1C1C1E]/60 mb-2">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <p className="text-[8px] uppercase tracking-widest font-semibold truncate max-w-[130px]">
                      {cleanLocation}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-[#1C1C1E]/5 pt-2">
                    {/* Drops Indicator */}
                    {merchant.activeDrops > 0 ? (
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-emerald-600">
                        {merchant.activeDrops} {merchant.activeDrops === 1 ? 'Drop' : 'Drops'}
                      </span>
                    ) : (
                      <span className="text-[8px] uppercase tracking-widest font-bold text-[#1C1C1E]/40">
                        No Drops
                      </span>
                    )}

                    {/* Rating Indicator */}
                    <div className="flex items-center gap-1 bg-[#1C1C1E]/5 px-1.5 py-0.5 rounded-sm">
                      {merchant.averageRating > 0 ? (
                        <>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="#D4AF37" className="shrink-0">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          <span className="text-[9px] font-bold text-[#1C1C1E]">{Number(merchant.averageRating).toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-[8px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">New</span>
                      )}
                    </div>
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
      <div className="absolute top-3 right-3 md:top-6 md:right-5 z-1000 flex flex-col gap-2 items-end animate-in fade-in slide-in-from-right duration-500">
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

      {/* ─── Bottom Floating Layout ─── */}
      <div className="absolute bottom-[88px] md:bottom-8 left-0 right-0 z-1000 px-4 pointer-events-none flex flex-col items-center gap-3">
        
        {/* Nearby Merchants Info (when pin is active) */}
        {userPin && nearbyMerchants.length > 0 && !routeInfo && (
          <div className="bg-white/95 backdrop-blur-lg border border-[#1C1C1E]/10 shadow-xl rounded-lg px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
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

        {/* Route Info */}
        {routeInfo && (
          <div className="bg-white/95 backdrop-blur-lg border border-[#1C1C1E]/10 shadow-2xl rounded-lg px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-[280px] pointer-events-auto">
            <div className="flex flex-col gap-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1C1C1E] text-[#D4AF37] shadow-md shrink-0">
                    {routeInfo.mode === "driving" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1-4 0m0 0H9m-4 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1-4 0" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1" />
                        <path d="m9 20 3-6 3 6" />
                        <path d="m6 12 5-3 5 3" />
                        <path d="M12 9v6" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-[#1C1C1E]">
                      {routeInfo.duration}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/60 font-semibold">
                      {routeInfo.distance}
                    </span>
                  </div>
                </div>

                {/* Dropdown Toggle */}
                <button
                  onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
                  className="flex items-center gap-1.5 bg-[#1C1C1E]/5 hover:bg-[#1C1C1E]/10 px-2 py-1.5 rounded transition-colors text-[9px] uppercase tracking-widest font-bold text-[#1C1C1E]"
                >
                  {routeInfo.mode === "driving" ? "Vehicle" : "Walking"}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform", isRouteDropdownOpen && "rotate-180")}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Dropdown Menu */}
              {isRouteDropdownOpen && (
                <div className="absolute bottom-full right-0 mb-3 w-[160px] bg-white border border-[#1C1C1E]/10 shadow-2xl rounded-lg overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => { routeInfo.setMode("driving"); setIsRouteDropdownOpen(false); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-3 text-[9px] uppercase tracking-widest font-bold transition-colors text-left",
                      routeInfo.mode === "driving" ? "bg-[#1C1C1E] text-[#D4AF37]" : "text-[#1C1C1E] hover:bg-[#1C1C1E]/5"
                    )}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1-4 0" />
                    </svg>
                    Vehicle
                  </button>
                  <button
                    onClick={() => { routeInfo.setMode("walking"); setIsRouteDropdownOpen(false); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-3 text-[9px] uppercase tracking-widest font-bold transition-colors text-left",
                      routeInfo.mode === "walking" ? "bg-[#1C1C1E] text-[#D4AF37]" : "text-[#1C1C1E] hover:bg-[#1C1C1E]/5"
                    )}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5" r="1" />
                      <path d="m9 20 3-6 3 6" />
                      <path d="m6 12 5-3 5 3" />
                      <path d="M12 9v6" />
                    </svg>
                    Walking
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Map Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 pointer-events-auto">
          {/* Locate Me / Track Location Button */}
          <button
            onClick={handleTrackLocation}
            disabled={isLocating}
            className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:px-5 md:py-2.5 rounded-lg shadow-lg transition-all duration-200 text-[9px] md:text-[10px] uppercase tracking-widest font-semibold border bg-white/95 backdrop-blur-lg text-[#1C1C1E] border-[#1C1C1E]/10 hover:bg-[#FAF9F6] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Track My Location"
          >
            {isLocating ? (
              <span className="w-4 h-4 rounded-full border-2 border-[#1C1C1E]/20 border-t-[#1C1C1E] animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
            )}
            <span className="hidden md:inline">{isLocating ? "Locating..." : "Locate Me"}</span>
          </button>

          {/* Draggable Drop Pin Button */}
          <div
            ref={dragButtonRef}
            draggable={!userPin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:px-5 md:py-2.5 rounded-lg shadow-lg transition-all duration-200 text-[9px] md:text-[10px] uppercase tracking-widest font-semibold border select-none",
              userPin
                ? "bg-linear-to-r from-[#0EA5E9] to-[#0284C7] text-white border-[#0EA5E9]/30 cursor-default"
                : isDraggingButton
                ? "bg-[#0EA5E9]/20 text-[#0EA5E9] border-[#0EA5E9]/30 scale-95 cursor-grabbing"
                : "bg-white/95 backdrop-blur-lg text-[#1C1C1E] border-[#1C1C1E]/10 hover:bg-white hover:border-[#1C1C1E]/20 cursor-grab hover:scale-105"
            )}
            title={userPin ? "Pin Dropped" : "Drag Pin to Map"}
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
            <span className="hidden md:inline">
              {userPin ? "Pin Dropped" : isDraggingButton ? "Drop on Map" : "Drag Pin to Map"}
            </span>
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
