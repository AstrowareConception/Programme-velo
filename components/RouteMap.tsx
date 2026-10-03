"use client";

import { useEffect, useRef } from "react";
import type { ClimbChallenge } from "@/lib/routes";

export function RouteMap({ climb, progress = 0 }: { climb: ClimbChallenge; progress?: number }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: any;

    import("leaflet").then((L) => {
      if (disposed || !el.current) return;
      map = L.map(el.current, { zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "© OpenStreetMap"
      }).addTo(map);

      const route = L.polyline(climb.coordinates, { weight: 5, opacity: 0.85 }).addTo(map);
      map.fitBounds(route.getBounds(), { padding: [24, 24] });

      const start = climb.coordinates[0];
      const end = climb.coordinates[climb.coordinates.length - 1];
      L.circleMarker(start, { radius: 6 }).bindTooltip("Départ").addTo(map);
      L.circleMarker(end, { radius: 6 }).bindTooltip("Sommet").addTo(map);

      const fraction = Math.max(0, Math.min(1, progress));
      const scaled = fraction * (climb.coordinates.length - 1);
      const index = Math.min(climb.coordinates.length - 2, Math.floor(scaled));
      const part = scaled - index;
      const a = climb.coordinates[index];
      const b = climb.coordinates[index + 1];
      const current: [number, number] = [
        a[0] + (b[0] - a[0]) * part,
        a[1] + (b[1] - a[1]) * part
      ];
      L.circleMarker(current, { radius: 9, weight: 4 }).bindTooltip("Ta position").addTo(map);
    });

    return () => {
      disposed = true;
      if (map) map.remove();
    };
  }, [climb, progress]);

  return <div ref={el} className="routeMap" aria-label={`Carte de ${climb.name}`} />;
}
