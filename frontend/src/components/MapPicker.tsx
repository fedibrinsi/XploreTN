import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default Leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Component to handle programmatic map movements
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom()); // Preserve zoom level if already set
  }, [center, map]);
  return null;
}

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number) => void;
  zoom?: number;
  height?: string;
  className?: string;
}

// Correct LocationMarker implementation
function LocationMarkerEventTracker({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition?: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (setPosition) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return <Marker position={position}></Marker>;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  zoom = 10,
  height = "400px",
  className = "",
}: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const isEditable = !!onLocationChange;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      // TODO: fix it
      // Use Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        if (onLocationChange) {
          onLocationChange(parseFloat(result.lat), parseFloat(result.lon));
        }
      } else {
        alert("Location not found");
      }
    } catch (err) {
      console.error("Geocoding error", err);
    }
  };

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {isEditable && (
        <form
          onSubmit={handleSearch}
          className="flex items-center bg-surface-container-low rounded-xl px-4 py-2 border border-outline-variant/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
        >
          <span className="material-symbols-outlined text-on-surface-variant mr-3">
            search
          </span>
          <input
            type="text"
            placeholder="Search for a location (e.g. Sidi Bou Said)..."
            className="flex-1 bg-transparent border-none text-sm outline-none text-on-surface"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="text-primary font-bold text-xs uppercase tracking-widest ml-3 hover:text-primary-container"
          >
            Find
          </button>
        </form>
      )}

      <div
        className="w-full rounded-[2rem] overflow-hidden shadow-inner border border-outline-variant/20 relative z-0"
        style={{ height }}
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <ChangeView center={[latitude, longitude]} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          <LocationMarkerEventTracker
            position={[latitude, longitude]}
            setPosition={
              isEditable
                ? (pos) => onLocationChange!(pos[0], pos[1])
                : undefined
            }
          />
        </MapContainer>

        {/* Real-time Coordinate Display Overlay */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-primary shadow-lg border border-primary/20 pointer-events-none flex items-center gap-2">
           <span className="material-symbols-outlined text-[14px]">my_location</span>
           <span>LAT: {latitude.toFixed(4)}</span>
           <span className="opacity-30">|</span>
           <span>LNG: {longitude.toFixed(4)}</span>
        </div>
      </div>

      {isEditable && (
        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 font-medium">
          <span className="material-symbols-outlined text-[14px]">touch_app</span>
          Click on the map to pinpoint the exact location
        </p>
      )}
    </div>
  );
}
