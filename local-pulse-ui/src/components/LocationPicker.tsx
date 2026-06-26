import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Locate, Search, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PickedLocation {
  latitude: number;
  longitude: number;
  city: string;
}

interface Props {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  onClose?: () => void;
  /** If true render as inline panel, not a modal overlay */
  inline?: boolean;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.suburb ||
      data.address?.county ||
      "Selected location"
    );
  } catch {
    return "Selected location";
  }
}

async function searchPlace(query: string): Promise<{ lat: number; lon: number; display_name: string }[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
    );
    return res.json();
  } catch {
    return [];
  }
}

export function LocationPicker({ value, onChange, onClose, inline = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [pending, setPending] = useState<PickedLocation | null>(value);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const initMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = await import("leaflet");

    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet", "true");
      document.head.appendChild(link);
    }

    const center: [number, number] = pending
      ? [pending.latitude, pending.longitude]
      : [20.5937, 78.9629]; // India center as neutral fallback

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView(
      center,
      pending ? 14 : 5
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      html: `<div style="background:#2563eb;width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
      className: "",
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (pending) {
      markerRef.current = L.marker([pending.latitude, pending.longitude], { icon }).addTo(map);
    }

    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      }
      setIsGeocoding(true);
      const city = await reverseGeocode(lat, lng);
      setIsGeocoding(false);
      setPending({ latitude: lat, longitude: lng, city });
    });

    mapInstanceRef.current = map;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const geolocate = async () => {
    if (!navigator.geolocation) return;
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const city = await reverseGeocode(latitude, longitude);
        const loc = { latitude, longitude, city };
        setPending(loc);
        const L = await import("leaflet");
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
          const icon = L.divIcon({
            html: `<div style="background:#2563eb;width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
            className: "",
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            markerRef.current = L.marker([latitude, longitude], { icon }).addTo(mapInstanceRef.current);
          }
        }
        setIsGeolocating(false);
      },
      () => setIsGeolocating(false),
      { timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchPlace(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const selectSearchResult = async (result: any) => {
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    const city = result.display_name.split(",")[0];
    const loc = { latitude, longitude, city };
    setPending(loc);
    setSearchResults([]);
    setSearchQuery("");
    const L = await import("leaflet");
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 14);
      const icon = L.divIcon({
        html: `<div style="background:#2563eb;width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
        className: "",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude], { icon }).addTo(mapInstanceRef.current);
      }
    }
  };

  const confirm = () => {
    if (pending) {
      onChange(pending);
      onClose?.();
    }
  };

  const content = (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search a place..."
            className="pl-9 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button variant="outline" onClick={handleSearch} disabled={isSearching} className="h-10 px-3">
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button variant="outline" onClick={geolocate} disabled={isGeolocating} className="h-10 px-3" title="Use my location">
          {isGeolocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search results dropdown */}
      {searchResults.length > 0 && (
        <div className="border rounded-xl bg-background shadow-lg divide-y text-sm max-h-48 overflow-y-auto">
          {searchResults.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2.5 hover:bg-muted truncate"
              onClick={() => selectSearchResult(r)}
            >
              <MapPin className="inline h-3.5 w-3.5 mr-1.5 text-primary" />
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <div ref={mapRef} className="rounded-xl border overflow-hidden" style={{ height: 300 }} />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur text-xs text-muted-foreground px-3 py-1 rounded-full border pointer-events-none">
          Click anywhere on the map to pin location
        </div>
      </div>

      {/* Selected location */}
      {pending && pending.latitude !== 0 && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
          {isGeocoding ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          ) : (
            <MapPin className="h-4 w-4 text-primary shrink-0" />
          )}
          <div className="text-sm">
            <div className="font-semibold">{pending.city}</div>
            <div className="text-xs text-muted-foreground">
              {pending.latitude.toFixed(5)}, {pending.longitude.toFixed(5)}
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={confirm}
        disabled={!pending || pending.latitude === 0}
        className="h-11 font-semibold"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Confirm Location
      </Button>
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-background rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-base">Select Location</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center"
              aria-label="Close"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="p-4">{content}</div>
      </div>
    </div>
  );
}
