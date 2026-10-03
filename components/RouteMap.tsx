"use client";

import { useEffect, useRef } from "react";
import type { ClimbChallenge } from "@/lib/routes";

function positionAt(climb: ClimbChallenge, progress: number): [number, number] {
  const fraction = Math.max(0, Math.min(1, progress));
  const scaled = fraction * (climb.coordinates.length - 1);
  const index = Math.min(climb.coordinates.length - 2, Math.floor(scaled));
  const part = scaled - index;
  const a = climb.coordinates[index];
  const b = climb.coordinates[index + 1] ?? a;
  return [
    a[0] + (b[0] - a[0]) * part,
    a[1] + (b[1] - a[1]) * part
  ];
}

export function RouteMap({
  climb,
  progress = 0,
  ghostProgress
}: {
  climb: ClimbChallenge;
  progress?: number;
  ghostProgress?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const riderRef = useRef<any>(null);
  const ghostRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;

    import("leaflet").then((L) => {
      if (disposed || !el.current || !climb.coordinates.length) return;

      mapRef.current?.remove?.();
      const map = L.map(el.current, { zoomControl: true, attributionControl: true });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "© OpenStreetMap"
      }).addTo(map);

      const route = L.polyline(climb.coordinates, { weight: 5, opacity: 0.85 }).addTo(map);
      map.fitBounds(route.getBounds(), { padding: [24, 24] });

      const start = climb.coordinates[0];
      const end = climb.coordinates[climb.coordinates.length - 1];
      L.circleMarker(start, { radius: 6 }).bindTooltip("Départ").addTo(map);
      L.circleMarker(end, { radius: 6 }).bindTooltip("Arrivée").addTo(map);

      riderRef.current = L.circleMarker(positionAt(climb, progress), { radius: 9, weight: 4 })
        .bindTooltip("Toi")
        .addTo(map);

      if (ghostProgress !== undefined) {
        ghostRef.current = L.circleMarker(positionAt(climb, ghostProgress), {
          radius: 7,
          weight: 2,
          dashArray: "4 4",
          opacity: 0.65,
          fillOpacity: 0.18
        }).bindTooltip("Ghost PB").addTo(map);
      }
    });

    return () => {
      disposed = true;
      riderRef.current = null;
      ghostRef.current = null;
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, [climb]);

  useEffect(() => {
    if (!riderRef.current || !climb.coordinates.length) return;
    riderRef.current.setLatLng(positionAt(climb, progress));
  }, [climb, progress]);

  useEffect(() => {
    if (!mapRef.current || !climb.coordinates.length) return;
    import("leaflet").then((L) => {
      if (ghostProgress === undefined) {
        if (ghostRef.current) {
          ghostRef.current.remove();
          ghostRef.current = null;
        }
        return;
      }
      const pos = positionAt(climb, ghostProgress);
      if (ghostRef.current) ghostRef.current.setLatLng(pos);
      else {
        ghostRef.current = L.circleMarker(pos, {
          radius: 7,
          weight: 2,
          dashArray: "4 4",
          opacity: 0.65,
          fillOpacity: 0.18
        }).bindTooltip("Ghost PB").addTo(mapRef.current);
      }
    });
  }, [climb, ghostProgress]);

  return <div ref={el} className="routeMap" role="img" aria-label={`Carte de ${climb.name}, progression ${Math.round(progress * 100)} %`} />;
}
