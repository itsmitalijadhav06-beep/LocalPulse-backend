import { useEffect, useRef } from "react";
import type { GeoPoint } from "@/types";

interface Marker {
  position: GeoPoint;
  title?: string;
  color?: string;
}

interface Props {
  center: GeoPoint;
  zoom?: number;
  markers?: Marker[];
  radiusKm?: number;
  className?: string;
  height?: number | string;
}

/**
 * Lightweight Leaflet wrapper. Loads CSS + JS from CDN at runtime so the
 * component is SSR-safe and avoids bundler import issues.
 */
export function MapView({ center, zoom = 13, markers = [], radiusKm, className, height = 320 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: any;
    let cancelled = false;

    async function init() {
      if (!ref.current) return;
      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.setAttribute("data-leaflet", "true");
        document.head.appendChild(link);
      }
      const L = await import("leaflet");
      if (cancelled || !ref.current) return;

      map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([center.latitude, center.longitude], zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      markers.forEach((m) => {
        L.circleMarker([m.position.latitude, m.position.longitude], {
          radius: 8,
          fillColor: m.color ?? "#ea7c30",
          color: "#fff",
          weight: 2,
          fillOpacity: 0.95,
        })
          .addTo(map)
          .bindPopup(m.title ?? "");
      });

      if (radiusKm) {
        L.circle([center.latitude, center.longitude], {
          radius: radiusKm * 1000,
          color: "#2563eb",
          fillColor: "#2563eb",
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.latitude, center.longitude, zoom, radiusKm, JSON.stringify(markers)]);

  return (
    <div
      ref={ref}
      className={"rounded-2xl overflow-hidden border bg-muted " + (className ?? "")}
      style={{ height }}
    />
  );
}
