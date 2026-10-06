"use client";

import Image from "next/image";
import { useState } from "react";
import type { ClimbChallenge } from "@/lib/routes";
import { routePhotoDate, routePhotoIndex, routePhotos, type RoutePhotoStop } from "@/lib/route-photos";

function PhotoFigure({ stop }: { stop: RoutePhotoStop }) {
  const [failed, setFailed] = useState(false);
  const { photo } = stop;
  return <figure className="landscapeFigure">
    <div className="landscapeImage" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
      {failed ? <div className="landscapeUnavailable" role="status"><p>Photo indisponible. Les lieux et les consignes restent accessibles.</p><button type="button" className="secondary miniButton" onClick={() => setFailed(false)}>Réessayer la photo</button></div>
        : <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} unoptimized loading="lazy" onError={() => setFailed(true)} />}
    </div>
    <figcaption>
      <strong>{photo.title}</strong><p>{photo.caption}</p>
      <small>Photo · {routePhotoDate(photo.date)} · {photo.author} · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a> · <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">Source et original ↗</a></small>
      <small>Version allégée en WebP, sans recadrage · même licence que l’original.</small>
    </figcaption>
  </figure>;
}

export function RoutePhotos({ route, currentKm }: { route: ClimbChallenge; currentKm?: number }) {
  const [open, setOpen] = useState(false);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const stops = routePhotos(route);
  if (!stops.length) return null;
  const index = Math.min(stops.length - 1, manualIndex ?? routePhotoIndex(stops, currentKm));
  const stop = stops[index];
  const following = currentKm !== undefined && manualIndex === null;
  const upcoming = following && stop.km > currentKm;
  return <section className="routePhotos" aria-label="Photos du parcours">
    <details onToggle={event => setOpen(event.currentTarget.open)}>
      <summary>Voir les photos · {stops.length} {stops.length === 1 ? "lieu" : "lieux"}</summary>
      {open && <div className="landscapeGallery">
        <p className="landscapeHint">Vues des lieux, prises à une autre date et parfois hors du tracé. Elles accompagnent les repères, sans représenter ta position réelle.</p>
        <div className="landscapeStop"><strong>{following ? upcoming ? "À découvrir" : "Dernier repère illustré" : "Aperçu du parcours"} · {stop.place}</strong><span>{stop.km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km sur le parcours</span></div>
        <PhotoFigure key={stop.id} stop={stop} />
        {stops.length > 1 && <div className="landscapeNavigation" role="group" aria-label="Navigation des photos">
          <button type="button" className="secondary miniButton" disabled={index === 0} onClick={() => setManualIndex(index - 1)}>Photo précédente</button>
          <span>{index + 1} / {stops.length}</span>
          <button type="button" className="secondary miniButton" disabled={index === stops.length - 1} onClick={() => setManualIndex(index + 1)}>Photo suivante</button>
        </div>}
        {currentKm !== undefined && manualIndex !== null && <button type="button" className="secondary miniButton" onClick={() => setManualIndex(null)}>Suivre les repères</button>}
      </div>}
    </details>
  </section>;
}
